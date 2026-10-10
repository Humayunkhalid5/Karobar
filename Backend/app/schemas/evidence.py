"""Financial Evidence Passport contract — explainable evidence, never a credit score."""
from __future__ import annotations

from datetime import date
from typing import Union

from pydantic import BaseModel, Field


class MonthSalesPoint(BaseModel):
    month: str
    sales_paisa: int
    sales_display: str


class PassportResponse(BaseModel):
    generated_at: date
    history_months: int
    total_recorded_events: int
    total_sales_paisa: int
    total_sales_display: str
    average_monthly_sales_paisa: int
    average_monthly_sales_display: str
    outstanding_receivables_paisa: int
    outstanding_receivables_display: str
    total_recovered_paisa: int
    total_recovered_display: str
    credit_sales_total_paisa: int
    credit_sales_total_display: str
    recovery_rate_pct: float | None = None
    recovery_pattern: str  # qualitative label
    evidence_coverage_pct: float
    documentation_gaps: int  # credit sales without supporting evidence
    revenue_consistency: str  # qualitative label
    monthly_sales: list[MonthSalesPoint]
    customer_concentration_pct: float | None = None
    customer_concentration_label: str
    # Raw numeric metrics consumed by the financing matching engine
    metrics: dict[str, Union[int, float]] = Field(default_factory=dict)
