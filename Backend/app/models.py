"""SQLAlchemy ORM models: the deterministic business event ledger."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("merchant_id", "name_normalized", name="uq_merchant_customer_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(36), default="demo", index=True)
    name_normalized: Mapped[str] = mapped_column(String(120), index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    events: Mapped[list["BusinessEvent"]] = relationship(back_populates="customer")


class BusinessEvent(Base):
    """One confirmed business event in the ledger.

    Money is stored as integer paisa (1 PKR = 100 paisa) — never floats.
    `settled_paisa` tracks FIFO recovery progress on credit sales only.
    """

    __tablename__ = "business_events"
    __table_args__ = (Index("ix_events_type_status_date", "event_type", "payment_status", "occurred_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(36), default="demo", index=True)
    # cash_sale | credit_sale | payment_received | expense
    event_type: Mapped[str] = mapped_column(String(20))
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    counterparty_raw: Mapped[str | None] = mapped_column(String(160), nullable=True)
    amount_paisa: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="PKR")
    occurred_at: Mapped[date] = mapped_column(Date, index=True)
    # outstanding | paid (derived from settlement for credit sales)
    payment_status: Mapped[str] = mapped_column(String(12))
    # FIFO settlement progress on credit sales (paisa applied against this sale)
    settled_paisa: Mapped[int] = mapped_column(Integer, default=0)
    # voice | receipt | manual | seed
    source_type: Mapped[str] = mapped_column(String(10))
    raw_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # groq | gemini | demo | seed — which provider produced the extraction
    ai_provider: Mapped[str | None] = mapped_column(String(16), nullable=True)
    # pending | confirmed | rejected — only confirmed events count in metrics
    verification_status: Mapped[str] = mapped_column(String(12), default="confirmed")
    evidence_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    customer: Mapped["Customer | None"] = relationship(back_populates="events")
