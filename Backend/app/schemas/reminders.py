"""Payment reminder contracts."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class ReminderRequest(BaseModel):
    customer_id: int
    tone: str = Field("friendly", pattern="^(friendly|firm)$")


class ReminderResponse(BaseModel):
    customer_id: int
    customer_name: str
    outstanding_paisa: int
    outstanding_display: str
    oldest_unpaid: date | None = None
    message: str  # editable draft — nothing is ever sent automatically
    provider: str
