"""Customers (udhaar counterparties) with ledger-computed balances."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.db import get_db
from app.errors import NotFoundError
from app.models import BusinessEvent, Customer
from app.schemas.customers import CustomerDetailResponse, CustomerListResponse, CustomerOut
from app.schemas.events import EventType
from app.services.ledger import (
    CONFIRMED,
    customer_oldest_unpaid,
    customer_outstanding_paisa,
    event_to_out,
    normalize_name,
)
from app.services.money import format_pkr

router = APIRouter(prefix="/customers", tags=["customers"])


def _sum_amount(db: Session, customer_id: int, event_type: EventType) -> int:
    total = (
        db.query(func.coalesce(func.sum(BusinessEvent.amount_paisa), 0))
        .filter(
            BusinessEvent.customer_id == customer_id,
            BusinessEvent.event_type == event_type.value,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .scalar()
    )
    return int(total or 0)


def _customer_out(db: Session, customer: Customer) -> CustomerOut:
    outstanding = customer_outstanding_paisa(db, customer.id)
    event_count = (
        db.query(func.count(BusinessEvent.id))
        .filter(BusinessEvent.customer_id == customer.id, BusinessEvent.verification_status == CONFIRMED)
        .scalar()
        or 0
    )
    credit_total = _sum_amount(db, customer.id, EventType.credit_sale)
    recovered = _sum_amount(db, customer.id, EventType.payment_received)
    last_activity = (
        db.query(func.max(BusinessEvent.occurred_at))
        .filter(BusinessEvent.customer_id == customer.id, BusinessEvent.verification_status == CONFIRMED)
        .scalar()
    )
    return CustomerOut(
        id=customer.id,
        name=customer.display_name,
        outstanding_paisa=outstanding,
        outstanding_display=format_pkr(outstanding),
        oldest_unpaid=customer_oldest_unpaid(db, customer.id),
        event_count=int(event_count),
        credit_total_paisa=credit_total,
        credit_total_display=format_pkr(credit_total),
        recovered_paisa=recovered,
        recovered_display=format_pkr(recovered),
        last_activity=last_activity,
    )


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    db: Session = Depends(get_db),
    merchant_id: str = Depends(get_merchant_id),
    q: str | None = Query(None, max_length=80, description="Case-insensitive name search"),
):
    query = db.query(Customer).filter(Customer.merchant_id == merchant_id)
    if q:
        query = query.filter(Customer.name_normalized.like(f"%{normalize_name(q)}%"))
    customers = query.order_by(Customer.display_name.asc()).all()
    # Biggest udhaar first — the merchant's natural priority order.
    outs = [_customer_out(db, c) for c in customers]
    outs.sort(key=lambda c: (-c.outstanding_paisa, c.name.lower()))
    return CustomerListResponse(total=len(outs), customers=outs)


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer(customer_id: int, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    customer = (
        db.query(Customer)
        .filter(Customer.merchant_id == merchant_id, Customer.id == customer_id)
        .first()
    )
    if customer is None:
        raise NotFoundError(f"customer {customer_id} not found")
    rows = (
        db.query(BusinessEvent)
        .filter(BusinessEvent.merchant_id == merchant_id, BusinessEvent.customer_id == customer_id)
        .order_by(BusinessEvent.occurred_at.desc(), BusinessEvent.id.desc())
        .all()
    )
    return CustomerDetailResponse(
        customer=_customer_out(db, customer),
        events=[event_to_out(event, customer.display_name) for event in rows],
    )
