"""Capture flow contracts: transcription and AI-drafted events pending verification."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field

from app.schemas.events import EventType, PaymentStatus, SourceType


class TranscriptResponse(BaseModel):
    transcript: str
    provider: str


class ExtractTextRequest(BaseModel):
    text: str = Field(min_length=2, max_length=2000)


class DraftEvent(BaseModel):
    """AI extraction result shown on the 'Karobaar understood this' review card.

    Nothing here is saved until the merchant explicitly confirms via POST /api/events.
    """

    event_type: EventType | None = None
    counterparty: str | None = None
    customer_id: int | None = None
    customer_name: str | None = None
    amount_paisa: int | None = None
    amount_display: str | None = None
    occurred_at: date | None = None
    payment_status: PaymentStatus | None = None
    confidence: float | None = None
    notes: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    possible_duplicate: bool = False
    duplicate_of: int | None = None
    provider: str
    source_type: SourceType
    raw_input: str | None = None
    evidence_filename: str | None = None
