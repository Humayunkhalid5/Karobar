"""Core ledger enums and event contracts."""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class EventType(str, Enum):
    cash_sale = "cash_sale"
    credit_sale = "credit_sale"
    payment_received = "payment_received"
    expense = "expense"


class PaymentStatus(str, Enum):
    outstanding = "outstanding"
    paid = "paid"


class SourceType(str, Enum):
    voice = "voice"
    receipt = "receipt"
    manual = "manual"
    seed = "seed"


class VerificationStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"


class EventOut(BaseModel):
    id: int
    event_type: EventType
    customer_id: int | None = None
    customer_name: str | None = None
    counterparty_raw: str | None = None
    amount_paisa: int
    amount_display: str
    currency: str = "PKR"
    occurred_at: date
    payment_status: PaymentStatus
    settled_paisa: int
    source_type: SourceType
    raw_input: str | None = None
    ai_confidence: float | None = None
    ai_provider: str | None = None
    verification_status: VerificationStatus
    evidence_filename: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class EventCreate(BaseModel):
    """A merchant-verified event entering the ledger (accepts edits made on the review card)."""

    event_type: EventType
    customer_id: int | None = None
    counterparty: str | None = Field(None, max_length=120)
    amount_paisa: int = Field(gt=0)
    occurred_at: date
    payment_status: PaymentStatus | None = None
    source_type: SourceType = SourceType.manual
    raw_input: str | None = None
    ai_confidence: float | None = Field(None, ge=0, le=1)
    ai_provider: str | None = Field(None, max_length=16)
    evidence_filename: str | None = None
    notes: str | None = None


class EventUpdate(BaseModel):
    """Post-save edits. Counterparty cannot be re-linked; record a corrective event instead."""

    amount_paisa: int | None = Field(None, gt=0)
    occurred_at: date | None = None
    notes: str | None = None


class EventListResponse(BaseModel):
    total: int
    events: list[EventOut]
