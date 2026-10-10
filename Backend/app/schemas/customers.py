"""Customer list / statement contracts."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.events import EventOut


class CustomerOut(BaseModel):
    id: int
    name: str
    outstanding_paisa: int
    outstanding_display: str
    oldest_unpaid: date | None = None
    event_count: int
    credit_total_paisa: int
    credit_total_display: str
    recovered_paisa: int
    recovered_display: str
    last_activity: date | None = None


class CustomerListResponse(BaseModel):
    total: int
    customers: list[CustomerOut]


class CustomerDetailResponse(BaseModel):
    customer: CustomerOut
    events: list[EventOut]
