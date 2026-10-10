"""Payment reminders: AI drafts the message, the merchant reviews and sends it."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai import get_adapter
from app.ai.base import ProviderError
from app.auth import get_merchant_id
from app.db import get_db
from app.errors import AIUnavailableError, DomainValidationError, NotFoundError
from app.models import Customer
from app.schemas.reminders import ReminderRequest, ReminderResponse
from app.services.ledger import customer_oldest_unpaid, customer_outstanding_paisa
from app.services.money import format_pkr

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("/draft", response_model=ReminderResponse)
async def draft_reminder(payload: ReminderRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    customer = (
        db.query(Customer)
        .filter(Customer.merchant_id == merchant_id, Customer.id == payload.customer_id)
        .first()
    )
    if customer is None:
        raise NotFoundError(f"customer {payload.customer_id} not found")

    outstanding = customer_outstanding_paisa(db, customer.id)
    if outstanding <= 0:
        raise DomainValidationError(f"{customer.display_name} has no outstanding udhaar to remind about")

    oldest_unpaid = customer_oldest_unpaid(db, customer.id)
    try:
        result = await get_adapter().draft_reminder(customer.display_name, outstanding, oldest_unpaid, tone=payload.tone)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    return ReminderResponse(
        customer_id=customer.id,
        customer_name=customer.display_name,
        outstanding_paisa=outstanding,
        outstanding_display=format_pkr(outstanding),
        oldest_unpaid=oldest_unpaid,
        message=result.text,
        provider=result.provider,
    )
