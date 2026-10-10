"""Ledger CRUD. Every mutation recomputes FIFO udhaar settlement deterministically."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.db import get_db
from app.errors import NotFoundError
from app.models import BusinessEvent, Customer
from app.schemas.events import (
    EventCreate,
    EventListResponse,
    EventOut,
    EventUpdate,
    EventType,
    PaymentStatus,
    SourceType,
)
from app.services.ledger import confirm_event, delete_event, event_to_out, update_event

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    """Confirm a draft (or a manual entry) into the ledger — the only write path."""
    event, _created_customer = confirm_event(db, payload, merchant_id=merchant_id)
    return event_to_out(event)


@router.get("", response_model=EventListResponse)
async def list_events(
    db: Session = Depends(get_db),
    merchant_id: str = Depends(get_merchant_id),
    event_type: EventType | None = None,
    customer_id: int | None = None,
    payment_status: PaymentStatus | None = None,
    source_type: SourceType | None = None,
    date_from: date | None = Query(None, alias="from", description="Include events on/after this date"),
    date_to: date | None = Query(None, alias="to", description="Include events on/before this date"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    row_query = (
        db.query(BusinessEvent, Customer.display_name).outerjoin(Customer, BusinessEvent.customer_id == Customer.id)
    )
    count_query = db.query(func.count(BusinessEvent.id))

    filters = [BusinessEvent.merchant_id == merchant_id]
    if event_type is not None:
        filters.append(BusinessEvent.event_type == event_type.value)
    if customer_id is not None:
        filters.append(BusinessEvent.customer_id == customer_id)
    if payment_status is not None:
        filters.append(BusinessEvent.payment_status == payment_status.value)
    if source_type is not None:
        filters.append(BusinessEvent.source_type == source_type.value)
    if date_from is not None:
        filters.append(BusinessEvent.occurred_at >= date_from)
    if date_to is not None:
        filters.append(BusinessEvent.occurred_at <= date_to)
    if filters:
        row_query = row_query.filter(*filters)
        count_query = count_query.filter(*filters)

    total = int(count_query.scalar() or 0)
    rows = (
        row_query.order_by(BusinessEvent.occurred_at.desc(), BusinessEvent.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return EventListResponse(total=total, events=[event_to_out(event, name) for event, name in rows])


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: int, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    row = (
        db.query(BusinessEvent, Customer.display_name)
        .outerjoin(Customer, BusinessEvent.customer_id == Customer.id)
        .filter(BusinessEvent.merchant_id == merchant_id, BusinessEvent.id == event_id)
        .first()
    )
    if row is None:
        raise NotFoundError(f"event {event_id} not found")
    return event_to_out(row[0], row[1])


@router.patch("/{event_id}", response_model=EventOut)
async def patch_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    return event_to_out(update_event(db, event_id, payload))


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_event(event_id: int, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    delete_event(db, event_id)
