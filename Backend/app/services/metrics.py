"""Dashboard aggregates. Every number is computed from a single batch fetch for speed."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import month_bounds, month_key, pkt_today
from app.models import BusinessEvent, Customer
from app.schemas.dashboard import DashboardResponse, TopDebtor, TrendPoint
from app.schemas.events import EventType
from app.services.ledger import CONFIRMED, OUTSTANDING, event_to_out
from app.services.money import format_pkr

OVERDUE_DAYS = 30
SALE_TYPES = (EventType.cash_sale.value, EventType.credit_sale.value)

_OUTSTANDING_FILTER = (
    BusinessEvent.event_type == EventType.credit_sale.value,
    BusinessEvent.payment_status == OUTSTANDING,
    BusinessEvent.verification_status == CONFIRMED,
)


def sum_events(
    db: Session,
    *event_types: str,
    start: date | None = None,
    end: date | None = None,
    customer_id: int | None = None,
    merchant_id: str = "demo",
) -> int:
    """Legacy single-query aggregate (used by ask_engine.py)."""
    query = (
        db.query(func.coalesce(func.sum(BusinessEvent.amount_paisa), 0))
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.event_type.in_(event_types),
            BusinessEvent.verification_status == CONFIRMED,
        )
    )
    if start is not None:
        query = query.filter(BusinessEvent.occurred_at >= start)
    if end is not None:
        query = query.filter(BusinessEvent.occurred_at <= end)
    if customer_id is not None:
        query = query.filter(BusinessEvent.customer_id == customer_id)
    return int(query.scalar() or 0)


def outstanding_total_paisa(db: Session, *, overdue_only: bool = False, customer_id: int | None = None, merchant_id: str = "demo") -> int:
    """Legacy outstanding query (used by ask_engine.py)."""
    query = (
        db.query(func.coalesce(func.sum(BusinessEvent.amount_paisa - BusinessEvent.settled_paisa), 0)).filter(
            BusinessEvent.merchant_id == merchant_id,
            *_OUTSTANDING_FILTER
        )
    )
    if overdue_only:
        cutoff = pkt_today() - timedelta(days=OVERDUE_DAYS)
        query = query.filter(BusinessEvent.occurred_at <= cutoff)
    if customer_id is not None:
        query = query.filter(BusinessEvent.customer_id == customer_id)
    return int(query.scalar() or 0)


def top_debtor_row(db: Session, merchant_id: str = "demo"):
    """Legacy top debtor query (used by ask_engine.py)."""
    outstanding_expr = func.sum(BusinessEvent.amount_paisa - BusinessEvent.settled_paisa)
    return (
        db.query(
            Customer.id.label("customer_id"),
            Customer.display_name.label("name"),
            outstanding_expr.label("outstanding"),
            func.min(BusinessEvent.occurred_at).label("oldest_unpaid"),
        )
        .join(BusinessEvent, BusinessEvent.customer_id == Customer.id)
        .filter(BusinessEvent.merchant_id == merchant_id, *_OUTSTANDING_FILTER)
        .group_by(Customer.id, Customer.display_name)
        .order_by(outstanding_expr.desc())
        .first()
    )


def _fetch_confirmed_events(db: Session, merchant_id: str) -> list[BusinessEvent]:
    """Fetch all confirmed events for a merchant in a single query."""
    return (
        db.query(BusinessEvent)
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.verification_status == CONFIRMED,
        )
        .all()
    )


def _fetch_customers(db: Session, merchant_id: str) -> dict[int, str]:
    """Fetch all customer display names in a single query."""
    rows = (
        db.query(Customer.id, Customer.display_name)
        .filter(Customer.merchant_id == merchant_id)
        .all()
    )
    return {cid: name for cid, name in rows}


def dashboard_bundle(
    db: Session,
    today: date | None = None,
    merchant_id: str = "demo",
    *,
    _events: list[BusinessEvent] | None = None,
    _customers: dict[int, str] | None = None,
) -> DashboardResponse:
    """Compute dashboard metrics using 2 queries (events + customers) instead of 20+.

    Pass ``_events`` and ``_customers`` to reuse data already fetched by the caller.
    """
    today = today or pkt_today()
    month = month_key(today)
    m_start, m_end = month_bounds(month)
    overdue_cutoff = today - timedelta(days=OVERDUE_DAYS)

    events = _events if _events is not None else _fetch_confirmed_events(db, merchant_id)
    customers = _customers if _customers is not None else _fetch_customers(db, merchant_id)

    # --- Current month aggregations (single pass) ---
    month_sales = 0
    month_expenses = 0
    month_recovered = 0

    for ev in events:
        if ev.event_type in SALE_TYPES:
            if m_start <= ev.occurred_at <= m_end:
                month_sales += ev.amount_paisa
        elif ev.event_type == EventType.expense.value:
            if m_start <= ev.occurred_at <= m_end:
                month_expenses += ev.amount_paisa
        elif ev.event_type == EventType.payment_received.value:
            if m_start <= ev.occurred_at <= m_end:
                month_recovered += ev.amount_paisa

    # --- Outstanding and overdue (single pass) ---
    outstanding_total = 0
    overdue_total = 0
    cust_outstanding: dict[int, int] = defaultdict(int)

    for ev in events:
        if ev.event_type == EventType.credit_sale.value and ev.payment_status == OUTSTANDING:
            remaining = ev.amount_paisa - ev.settled_paisa
            outstanding_total += remaining
            if ev.occurred_at <= overdue_cutoff:
                overdue_total += remaining
            if ev.customer_id is not None and remaining > 0:
                cust_outstanding[ev.customer_id] += remaining

    # --- Top debtor (computed from cust_outstanding) ---
    top_debtor = None
    if cust_outstanding:
        top_cid = max(cust_outstanding, key=lambda c: cust_outstanding[c])
        top_amount = cust_outstanding[top_cid]
        top_name = customers.get(top_cid, "Unknown")
        # Find oldest unpaid event for this customer
        oldest_unpaid = None
        for ev in events:
            if (ev.customer_id == top_cid and ev.event_type == EventType.credit_sale.value
                    and ev.payment_status == OUTSTANDING and ev.amount_paisa > ev.settled_paisa):
                if oldest_unpaid is None or ev.occurred_at < oldest_unpaid:
                    oldest_unpaid = ev.occurred_at
        top_debtor = TopDebtor(
            customer_id=top_cid,
            name=top_name,
            outstanding_paisa=top_amount,
            outstanding_display=format_pkr(top_amount),
            oldest_unpaid=oldest_unpaid,
        )

    # --- Monthly trend: last 6 months with activity ---
    monthly_agg: dict[str, dict[str, int]] = defaultdict(lambda: {"sales": 0, "expenses": 0})
    for ev in events:
        mk = month_key(ev.occurred_at)
        if ev.event_type in SALE_TYPES:
            monthly_agg[mk]["sales"] += ev.amount_paisa
        elif ev.event_type == EventType.expense.value:
            monthly_agg[mk]["expenses"] += ev.amount_paisa

    sorted_months = sorted(monthly_agg.keys())[-6:]
    trend = [
        TrendPoint(
            month=mk,
            sales_paisa=monthly_agg[mk]["sales"],
            sales_display=format_pkr(monthly_agg[mk]["sales"]),
            expenses_paisa=monthly_agg[mk]["expenses"],
            expenses_display=format_pkr(monthly_agg[mk]["expenses"]),
        )
        for mk in sorted_months
    ]

    # --- Recent events (last 10, sorted in Python) ---
    recent_sorted = sorted(events, key=lambda e: (e.occurred_at, e.id), reverse=True)[:10]
    recent_events = [event_to_out(ev, customers.get(ev.customer_id)) for ev in recent_sorted]

    return DashboardResponse(
        today=today,
        month=month,
        month_sales_paisa=month_sales,
        month_sales_display=format_pkr(month_sales),
        month_expenses_paisa=month_expenses,
        month_expenses_display=format_pkr(month_expenses),
        month_recovered_paisa=month_recovered,
        month_recovered_display=format_pkr(month_recovered),
        outstanding_total_paisa=outstanding_total,
        outstanding_total_display=format_pkr(outstanding_total),
        overdue_total_paisa=overdue_total,
        overdue_total_display=format_pkr(overdue_total),
        top_debtor=top_debtor,
        monthly_trend=trend,
        recent_events=recent_events,
    )
