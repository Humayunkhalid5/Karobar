"""Dashboard bundle contract (one call powers the whole dashboard screen)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.events import EventOut


class TrendPoint(BaseModel):
    month: str  # YYYY-MM
    sales_paisa: int
    sales_display: str
    expenses_paisa: int
    expenses_display: str


class TopDebtor(BaseModel):
    customer_id: int
    name: str
    outstanding_paisa: int
    outstanding_display: str
    oldest_unpaid: date | None = None


class DashboardResponse(BaseModel):
    today: date
    month: str  # YYYY-MM
    month_sales_paisa: int
    month_sales_display: str
    month_expenses_paisa: int
    month_expenses_display: str
    month_recovered_paisa: int
    month_recovered_display: str
    outstanding_total_paisa: int
    outstanding_total_display: str
    overdue_total_paisa: int  # outstanding credit sales older than 30 days
    overdue_total_display: str
    top_debtor: TopDebtor | None
    monthly_trend: list[TrendPoint]
    recent_events: list[EventOut]
