"""FIFO udhaar settlement: recompute-on-mutation is the single source of truth."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.db import pkt_today
from app.errors import DomainValidationError, NotFoundError
from app.schemas.events import EventCreate, EventUpdate, EventType, SourceType
from app.services.ledger import (
    confirm_event,
    customer_oldest_unpaid,
    customer_outstanding_paisa,
    delete_event,
    find_possible_duplicate,
    get_or_create_customer,
    update_event,
)


def _credit_sale(db, customer_id: int, rupees: int, days_ago: int):
    return confirm_event(
        db,
        EventCreate(
            event_type=EventType.credit_sale,
            customer_id=customer_id,
            amount_paisa=rupees * 100,
            occurred_at=pkt_today() - timedelta(days=days_ago),
        ),
    )[0]


def _payment(db, customer_id: int, rupees: int, days_ago: int):
    return confirm_event(
        db,
        EventCreate(
            event_type=EventType.payment_received,
            customer_id=customer_id,
            amount_paisa=rupees * 100,
            occurred_at=pkt_today() - timedelta(days=days_ago),
        ),
    )[0]


@pytest.fixture()
def customer(db):
    return get_or_create_customer(db, "Ahmed")


def test_fifo_settles_oldest_sale_first(db, customer):
    sale_old = _credit_sale(db, customer.id, 100, days_ago=10)
    sale_new = _credit_sale(db, customer.id, 200, days_ago=5)
    payment = _payment(db, customer.id, 150, days_ago=1)

    db.refresh(sale_old)
    db.refresh(sale_new)
    assert sale_old.payment_status == "paid"
    assert sale_old.settled_paisa == 10000
    assert sale_new.payment_status == "outstanding"
    assert sale_new.settled_paisa == 5000
    assert customer_outstanding_paisa(db, customer.id) == 15000
    assert payment.payment_status == "paid"  # payments are facts, never "outstanding"


def test_excess_payment_is_recorded_but_not_overapplied(db, customer):
    sale = _credit_sale(db, customer.id, 100, days_ago=5)
    payment = _payment(db, customer.id, 500, days_ago=1)

    db.refresh(sale)
    assert sale.payment_status == "paid"
    assert sale.settled_paisa == 10000
    assert payment.amount_paisa == 50000  # full payment stays recorded as a fact
    assert customer_outstanding_paisa(db, customer.id) == 0


def test_oldest_unpaid_moves_forward_as_sales_are_settled(db, customer):
    _credit_sale(db, customer.id, 100, days_ago=10)
    sale_new = _credit_sale(db, customer.id, 200, days_ago=5)
    _payment(db, customer.id, 100, days_ago=1)

    oldest = customer_oldest_unpaid(db, customer.id)
    assert oldest == sale_new.occurred_at


def test_deleting_payment_recomputes_balances(db, customer):
    sale = _credit_sale(db, customer.id, 100, days_ago=5)
    payment = _payment(db, customer.id, 100, days_ago=1)
    db.refresh(sale)
    assert sale.payment_status == "paid"

    delete_event(db, payment.id)
    db.refresh(sale)
    assert sale.payment_status == "outstanding"
    assert sale.settled_paisa == 0
    assert customer_outstanding_paisa(db, customer.id) == 10000


def test_updating_amount_recomputes_settlement(db, customer):
    sale = _credit_sale(db, customer.id, 100, days_ago=5)
    _payment(db, customer.id, 100, days_ago=1)

    updated = update_event(db, sale.id, EventUpdate(amount_paisa=20000))
    assert updated.payment_status == "outstanding"
    assert updated.settled_paisa == 10000
    assert customer_outstanding_paisa(db, customer.id) == 10000


def test_update_future_date_rejected(db, customer):
    sale = _credit_sale(db, customer.id, 100, days_ago=5)
    with pytest.raises(DomainValidationError):
        update_event(db, sale.id, EventUpdate(occurred_at=pkt_today() + timedelta(days=1)))


def test_future_event_rejected(db):
    with pytest.raises(DomainValidationError):
        confirm_event(
            db,
            EventCreate(
                event_type=EventType.cash_sale,
                amount_paisa=10000,
                occurred_at=pkt_today() + timedelta(days=1),
            ),
        )


def test_too_old_event_rejected(db):
    with pytest.raises(DomainValidationError):
        confirm_event(
            db,
            EventCreate(
                event_type=EventType.cash_sale,
                amount_paisa=10000,
                occurred_at=pkt_today() - timedelta(days=800),
            ),
        )


def test_credit_sale_requires_customer(db):
    with pytest.raises(DomainValidationError):
        confirm_event(
            db,
            EventCreate(
                event_type=EventType.credit_sale,
                amount_paisa=10000,
                occurred_at=pkt_today(),
            ),
        )


def test_payment_requires_customer(db):
    with pytest.raises(DomainValidationError):
        confirm_event(
            db,
            EventCreate(
                event_type=EventType.payment_received,
                amount_paisa=10000,
                occurred_at=pkt_today(),
            ),
        )


def test_counterparty_creates_customer_case_insensitively(db, customer):
    event, created = confirm_event(
        db,
        EventCreate(
            event_type=EventType.credit_sale,
            counterparty="aHmed",
            amount_paisa=50000,
            occurred_at=pkt_today(),
            source_type=SourceType.manual,
        ),
    )
    assert created is False  # "aHmed" normalizes to the existing Ahmed
    assert event.customer_id == customer.id

    event2, created2 = confirm_event(
        db,
        EventCreate(
            event_type=EventType.credit_sale,
            counterparty="Zain Traders",
            amount_paisa=50000,
            occurred_at=pkt_today(),
        ),
    )
    assert created2 is True
    assert event2.customer.display_name == "Zain Traders"


def test_unknown_customer_id_rejected(db):
    with pytest.raises(NotFoundError):
        confirm_event(
            db,
            EventCreate(
                event_type=EventType.credit_sale,
                customer_id=9999,
                amount_paisa=50000,
                occurred_at=pkt_today(),
            ),
        )


def test_duplicate_detection_same_type_amount_date_customer(db, customer):
    sale = _credit_sale(db, customer.id, 100, days_ago=5)
    found = find_possible_duplicate(
        db,
        event_type="credit_sale",
        customer_id=customer.id,
        amount_paisa=10000,
        occurred_at=sale.occurred_at,
    )
    assert found is not None and found.id == sale.id

    different_amount = find_possible_duplicate(
        db,
        event_type="credit_sale",
        customer_id=customer.id,
        amount_paisa=20000,
        occurred_at=sale.occurred_at,
    )
    assert different_amount is None
