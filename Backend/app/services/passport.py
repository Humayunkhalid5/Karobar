"""Financial Evidence Passport — explainable business evidence, never a credit score.

Optimised: fetches all confirmed events in a single query and computes everything in Python.
"""
from __future__ import annotations

import statistics
from datetime import date

from sqlalchemy.orm import Session

from app.db import month_key, month_keys_between, months_between, pkt_today
from app.schemas.evidence import MonthSalesPoint, PassportResponse
from app.schemas.events import EventType
from app.services.metrics import SALE_TYPES, _fetch_confirmed_events
from app.services.money import format_pkr


def _recovery_pattern_label(rate: float | None) -> str:
    if rate is None:
        return "no credit sales recorded yet"
    if rate >= 70:
        return "strong"
    if rate >= 40:
        return "moderate"
    if rate > 0:
        return "early"
    return "none yet"


def _consistency_label(values: list[int]) -> str:
    if not values or statistics.mean(values) == 0:
        return "insufficient data"
    cv = statistics.pstdev(values) / statistics.mean(values)
    if cv < 0.25:
        return "consistent"
    if cv < 0.5:
        return "variable"
    return "irregular"


def _empty_passport(today: date) -> PassportResponse:
    return PassportResponse(
        generated_at=today,
        history_months=0,
        total_recorded_events=0,
        total_sales_paisa=0,
        total_sales_display=format_pkr(0),
        average_monthly_sales_paisa=0,
        average_monthly_sales_display=format_pkr(0),
        outstanding_receivables_paisa=0,
        outstanding_receivables_display=format_pkr(0),
        total_recovered_paisa=0,
        total_recovered_display=format_pkr(0),
        credit_sales_total_paisa=0,
        credit_sales_total_display=format_pkr(0),
        recovery_rate_pct=None,
        recovery_pattern="no credit sales recorded yet",
        evidence_coverage_pct=0.0,
        documentation_gaps=0,
        revenue_consistency="insufficient data",
        monthly_sales=[],
        customer_concentration_pct=None,
        customer_concentration_label="no credit sales yet",
        metrics={
            "history_months": 0,
            "avg_monthly_sales_paisa": 0,
            "total_sales_paisa": 0,
            "outstanding_receivables_paisa": 0,
            "recovery_rate_pct": 0,
            "evidence_coverage_pct": 0,
        },
    )


def compute_passport(
    db: Session,
    today: date | None = None,
    merchant_id: str = "demo",
    *,
    _events: list | None = None,
) -> PassportResponse:
    today = today or pkt_today()
    events = _events if _events is not None else _fetch_confirmed_events(db, merchant_id)
    total_events = len(events)

    if not total_events:
        return _empty_passport(today)

    # --- Basic stats (single pass) ---
    first_date = min(ev.occurred_at for ev in events)
    history_months = months_between(first_date, today) + 1

    total_sales = 0
    credit_total = 0
    recovered_total = 0
    outstanding = 0
    with_evidence = 0
    doc_gaps = 0
    monthly_sales_agg: dict[str, int] = {}

    for ev in events:
        mk = month_key(ev.occurred_at)

        if ev.event_type in SALE_TYPES:
            total_sales += ev.amount_paisa
            monthly_sales_agg[mk] = monthly_sales_agg.get(mk, 0) + ev.amount_paisa

        if ev.event_type == EventType.credit_sale.value:
            credit_total += ev.amount_paisa
            if ev.payment_status == "outstanding":
                outstanding += ev.amount_paisa - ev.settled_paisa
            if ev.evidence_filename is None:
                doc_gaps += 1

        if ev.event_type == EventType.payment_received.value:
            recovered_total += ev.amount_paisa

        if ev.evidence_filename is not None:
            with_evidence += 1

    avg_monthly = total_sales // history_months if history_months > 0 else 0
    recovery_rate = round(recovered_total / credit_total * 100, 1) if credit_total > 0 else None
    evidence_pct = round(with_evidence / total_events * 100, 1)

    # --- Monthly sales points (fill gaps for consistency calculation) ---
    monthly_points: list[MonthSalesPoint] = []
    for key in month_keys_between(first_date, today):
        sales = monthly_sales_agg.get(key, 0)
        monthly_points.append(MonthSalesPoint(month=key, sales_paisa=sales, sales_display=format_pkr(sales)))

    # --- Customer concentration (one extra query for names) ---
    concentration_label = "no credit sales yet"
    top_share = None
    if credit_total > 0:
        # Build per-customer credit totals from events
        cust_credit_totals: dict[int, int] = {}
        for ev in events:
            if ev.event_type == EventType.credit_sale.value and ev.customer_id is not None:
                cust_credit_totals[ev.customer_id] = cust_credit_totals.get(ev.customer_id, 0) + ev.amount_paisa
        if cust_credit_totals:
            top_cid = max(cust_credit_totals, key=lambda c: cust_credit_totals[c])
            top_share = round(cust_credit_totals[top_cid] / credit_total * 100, 1)
            concentration_label = "diverse" if top_share < 40 else ("moderate" if top_share < 70 else "concentrated")

    return PassportResponse(
        generated_at=today,
        history_months=history_months,
        total_recorded_events=total_events,
        total_sales_paisa=total_sales,
        total_sales_display=format_pkr(total_sales),
        average_monthly_sales_paisa=avg_monthly,
        average_monthly_sales_display=format_pkr(avg_monthly),
        outstanding_receivables_paisa=outstanding,
        outstanding_receivables_display=format_pkr(outstanding),
        total_recovered_paisa=recovered_total,
        total_recovered_display=format_pkr(recovered_total),
        credit_sales_total_paisa=credit_total,
        credit_sales_total_display=format_pkr(credit_total),
        recovery_rate_pct=recovery_rate,
        recovery_pattern=_recovery_pattern_label(recovery_rate),
        evidence_coverage_pct=evidence_pct,
        documentation_gaps=doc_gaps,
        revenue_consistency=_consistency_label([p.sales_paisa for p in monthly_points]),
        monthly_sales=monthly_points,
        customer_concentration_pct=top_share,
        customer_concentration_label=concentration_label,
        metrics={
            "history_months": history_months,
            "avg_monthly_sales_paisa": avg_monthly,
            "total_sales_paisa": total_sales,
            "outstanding_receivables_paisa": outstanding,
            "recovery_rate_pct": recovery_rate if recovery_rate is not None else 0,
            "evidence_coverage_pct": evidence_pct,
        },
    )
