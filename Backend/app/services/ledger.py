"""Deterministic ledger: event confirmation, customer matching, FIFO udhaar settlement.

recompute_customer_settlement() is the single source of truth for udhaar: it
resets a customer's credit sales and replays every confirmed payment (oldest
first). Create/update/delete all funnel through it, so balances can never drift.
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import pkt_today
from app.errors import DomainValidationError, NotFoundError
from app.models import BusinessEvent, Customer
from app.schemas.capture import DraftEvent
from app.schemas.events import (
    EventCreate,
    EventOut,
    EventUpdate,
    EventType,
    PaymentStatus,
    SourceType,
    VerificationStatus,
)
from app.services.money import format_pkr, rupees_to_paisa

CONFIRMED = VerificationStatus.confirmed.value
OUTSTANDING = PaymentStatus.outstanding.value
PAID = PaymentStatus.paid.value

# Event types that must be linked to a customer
_CUSTOMER_TYPES = (EventType.credit_sale.value, EventType.payment_received.value)
# Event types whose edits/deletes affect udhaar settlement
_SETTLEMENT_TYPES = (EventType.credit_sale.value, EventType.payment_received.value)


def normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def infer_payment_status(event_type: EventType | None, provided: PaymentStatus | None) -> PaymentStatus:
    if provided is not None:
        return provided
    if event_type == EventType.credit_sale:
        return PaymentStatus.outstanding
    return PaymentStatus.paid


def get_or_create_customer(db: Session, name: str, merchant_id: str = "demo") -> Customer:
    normalized = normalize_name(name)
    if not normalized:
        raise DomainValidationError("customer name cannot be empty")
    existing = (
        db.query(Customer)
        .filter(Customer.merchant_id == merchant_id, Customer.name_normalized == normalized)
        .first()
    )
    if existing:
        return existing
    customer = Customer(merchant_id=merchant_id, name_normalized=normalized, display_name=name.strip())
    db.add(customer)
    db.flush()
    return customer


def find_customer_by_name(db: Session, name: str, merchant_id: str = "demo") -> Customer | None:
    return (
        db.query(Customer)
        .filter(Customer.merchant_id == merchant_id, Customer.name_normalized == normalize_name(name))
        .first()
    )


# --- FIFO settlement -----------------------------------------------------------


def recompute_customer_settlement(db: Session, customer_id: int) -> None:
    """Replay all confirmed payments against all credit sales, oldest first.

    Excess payment beyond the outstanding pool is simply not applied (the payment
    itself remains recorded as a fact of the business).
    """
    sales = (
        db.query(BusinessEvent)
        .filter(
            BusinessEvent.customer_id == customer_id,
            BusinessEvent.event_type == EventType.credit_sale.value,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .order_by(BusinessEvent.occurred_at.asc(), BusinessEvent.id.asc())
        .all()
    )
    payments = (
        db.query(BusinessEvent)
        .filter(
            BusinessEvent.customer_id == customer_id,
            BusinessEvent.event_type == EventType.payment_received.value,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .order_by(BusinessEvent.occurred_at.asc(), BusinessEvent.id.asc())
        .all()
    )
    for sale in sales:
        sale.settled_paisa = 0
        sale.payment_status = OUTSTANDING
    pool = sum(p.amount_paisa for p in payments)
    for sale in sales:
        if pool <= 0:
            break
        applied = min(sale.amount_paisa, pool)
        sale.settled_paisa = applied
        if applied >= sale.amount_paisa:
            sale.payment_status = PAID
        pool -= applied


def customer_outstanding_paisa(db: Session, customer_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(BusinessEvent.amount_paisa - BusinessEvent.settled_paisa), 0))
        .filter(
            BusinessEvent.customer_id == customer_id,
            BusinessEvent.event_type == EventType.credit_sale.value,
            BusinessEvent.payment_status == OUTSTANDING,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .scalar()
    )
    return int(total or 0)


def customer_oldest_unpaid(db: Session, customer_id: int) -> date | None:
    return (
        db.query(func.min(BusinessEvent.occurred_at))
        .filter(
            BusinessEvent.customer_id == customer_id,
            BusinessEvent.event_type == EventType.credit_sale.value,
            BusinessEvent.payment_status == OUTSTANDING,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .scalar()
    )


# --- Event lifecycle -------------------------------------------------------------


def confirm_event(db: Session, payload: EventCreate, merchant_id: str = "demo") -> tuple[BusinessEvent, bool]:
    """Persist a merchant-verified event. Returns (event, created_new_customer)."""
    today = pkt_today()
    if payload.occurred_at > today:
        raise DomainValidationError("occurred_at cannot be in the future")
    if payload.occurred_at < today - timedelta(days=730):
        raise DomainValidationError("occurred_at is too far in the past (max 2 years)")
    if payload.customer_id is None and not (payload.counterparty or "").strip() and payload.event_type.value in _CUSTOMER_TYPES:
        raise DomainValidationError(f"a {payload.event_type.value} event requires a customer (customer_id or counterparty)")

    customer: Customer | None = None
    created = False
    if payload.customer_id is not None:
        customer = db.get(Customer, payload.customer_id)
        if customer is None:
            raise NotFoundError(f"customer {payload.customer_id} not found")
    elif payload.counterparty and payload.event_type.value in _CUSTOMER_TYPES:
        customer = find_customer_by_name(db, payload.counterparty, merchant_id)
        if customer is None:
            customer = get_or_create_customer(db, payload.counterparty, merchant_id)
            created = True

    event = BusinessEvent(
        merchant_id=merchant_id,
        event_type=payload.event_type.value,
        customer_id=customer.id if customer else None,
        counterparty_raw=payload.counterparty,
        amount_paisa=payload.amount_paisa,
        occurred_at=payload.occurred_at,
        payment_status=infer_payment_status(payload.event_type, payload.payment_status).value,
        source_type=payload.source_type.value,
        raw_input=payload.raw_input,
        ai_confidence=payload.ai_confidence,
        ai_provider=payload.ai_provider,
        verification_status=CONFIRMED,
        evidence_filename=payload.evidence_filename,
        notes=payload.notes,
    )
    db.add(event)
    db.flush()

    if customer and event.event_type in _SETTLEMENT_TYPES:
        recompute_customer_settlement(db, customer.id)
    db.commit()
    db.refresh(event)
    return event, created


def update_event(db: Session, event_id: int, payload: EventUpdate) -> BusinessEvent:
    event = db.get(BusinessEvent, event_id)
    if event is None:
        raise NotFoundError(f"event {event_id} not found")

    dirty_settlement = False
    if payload.amount_paisa is not None and payload.amount_paisa != event.amount_paisa:
        event.amount_paisa = payload.amount_paisa
        dirty_settlement = event.event_type in _SETTLEMENT_TYPES
    if payload.occurred_at is not None and payload.occurred_at != event.occurred_at:
        if payload.occurred_at > pkt_today():
            raise DomainValidationError("occurred_at cannot be in the future")
        event.occurred_at = payload.occurred_at
        dirty_settlement = dirty_settlement or event.event_type in _SETTLEMENT_TYPES
    if payload.notes is not None:
        event.notes = payload.notes

    if dirty_settlement and event.customer_id:
        recompute_customer_settlement(db, event.customer_id)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int) -> None:
    event = db.get(BusinessEvent, event_id)
    if event is None:
        raise NotFoundError(f"event {event_id} not found")
    customer_id = event.customer_id
    affects_settlement = event.event_type in _SETTLEMENT_TYPES
    db.delete(event)
    db.flush()
    if affects_settlement and customer_id:
        recompute_customer_settlement(db, customer_id)
    db.commit()


# --- Drafts (capture flow) --------------------------------------------------------


def find_possible_duplicate(
    db: Session,
    *,
    event_type: str,
    customer_id: int | None,
    amount_paisa: int,
    occurred_at: date,
    merchant_id: str = "demo",
) -> BusinessEvent | None:
    """Same type + same customer + same amount + same date already in the ledger."""
    query = (
        db.query(BusinessEvent)
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.event_type == event_type,
            BusinessEvent.amount_paisa == amount_paisa,
            BusinessEvent.occurred_at == occurred_at,
            BusinessEvent.verification_status == CONFIRMED,
        )
    )
    if customer_id is not None:
        query = query.filter(BusinessEvent.customer_id == customer_id)
    else:
        query = query.filter(BusinessEvent.customer_id.is_(None))
    return query.first()


def build_draft(
    db: Session,
    extraction,
    *,
    source_type: SourceType,
    raw_input: str | None,
    evidence_filename: str | None,
    merchant_id: str = "demo",
) -> DraftEvent:
    """Convert an AI extraction into a reviewable draft. Never saves anything."""
    today = pkt_today()
    event_type = extraction.event_type
    amount_paisa = rupees_to_paisa(extraction.amount_rupees) if extraction.amount_rupees is not None else None

    occurred = extraction.occurred_at
    if occurred is not None and (occurred > today or occurred < today - timedelta(days=365)):
        occurred = None  # model arithmetic error -> ask the merchant

    status = extraction.payment_status
    if status is None and event_type is not None:
        status = infer_payment_status(event_type, None)

    customer = find_customer_by_name(db, extraction.counterparty, merchant_id) if extraction.counterparty else None

    missing: list[str] = []
    if event_type is None:
        missing.append("event_type")
    if amount_paisa is None or amount_paisa <= 0:
        amount_paisa = None
        missing.append("amount")
    if occurred is None:
        occurred = None
        missing.append("occurred_at")
    if event_type is not None and event_type.value in _CUSTOMER_TYPES and customer is None and not extraction.counterparty:
        missing.append("counterparty")

    duplicate_of = None
    if event_type is not None and amount_paisa and occurred is not None:
        duplicate_of = find_possible_duplicate(
            db,
            event_type=event_type.value,
            customer_id=customer.id if customer else None,
            amount_paisa=amount_paisa,
            occurred_at=occurred,
            merchant_id=merchant_id,
        )

    return DraftEvent(
        event_type=event_type,
        counterparty=extraction.counterparty,
        customer_id=customer.id if customer else None,
        customer_name=customer.display_name if customer else None,
        amount_paisa=amount_paisa,
        amount_display=format_pkr(amount_paisa) if amount_paisa else None,
        occurred_at=occurred,
        payment_status=status,
        confidence=extraction.confidence,
        notes=extraction.notes,
        missing_fields=missing,
        possible_duplicate=duplicate_of is not None,
        duplicate_of=duplicate_of.id if duplicate_of else None,
        provider=extraction.provider,
        source_type=source_type,
        raw_input=raw_input,
        evidence_filename=evidence_filename,
    )


def event_to_out(event: BusinessEvent, customer_name: str | None = None) -> EventOut:
    return EventOut(
        id=event.id,
        event_type=EventType(event.event_type),
        customer_id=event.customer_id,
        customer_name=customer_name or (event.customer.display_name if event.customer else None),
        counterparty_raw=event.counterparty_raw,
        amount_paisa=event.amount_paisa,
        amount_display=format_pkr(event.amount_paisa),
        currency=event.currency,
        occurred_at=event.occurred_at,
        payment_status=PaymentStatus(event.payment_status),
        settled_paisa=event.settled_paisa,
        source_type=SourceType(event.source_type),
        raw_input=event.raw_input,
        ai_confidence=event.ai_confidence,
        ai_provider=event.ai_provider,
        verification_status=VerificationStatus(event.verification_status),
        evidence_filename=event.evidence_filename,
        notes=event.notes,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )
