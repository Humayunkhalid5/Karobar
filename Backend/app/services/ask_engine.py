"""Ask Karobaar: the LLM picks a tool; SQL computes the numbers; the LLM only phrases.

Every tool returns exact values from the confirmed ledger. The answer composer
(LLM) is only ever given these numbers — it can never invent or calculate.
"""
from __future__ import annotations

import re
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.db import month_bounds, month_key, pkt_today, prev_month_key
from app.models import Customer
from app.schemas.events import EventType
from app.services.ledger import CONFIRMED, customer_outstanding_paisa, customer_oldest_unpaid, find_customer_by_name
from app.services.metrics import SALE_TYPES, sum_events, top_debtor_row
from app.services.money import format_pkr

SUPPORTED_TOOLS = (
    "total_outstanding",
    "top_debtor",
    "monthly_sales",
    "sales_comparison",
    "customer_outstanding",
)

SUGGESTIONS = [
    "Total udhaar kitna hai?",
    "Sab se zyada udhaar kis ka hai?",
    "Is month ki sales kitni hui?",
    "Is month aur pichle month ki sales ka comparison?",
]

_MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _valid_month(value: Any, today: date) -> str:
    if isinstance(value, str) and _MONTH_RE.match(value.strip()):
        return value.strip()
    return month_key(today)


# --- Tools (all deterministic, all SQL-backed) ---------------------------------


def tool_total_outstanding(db: Session, merchant_id: str = "demo") -> dict[str, Any]:
    from app.services.metrics import outstanding_total_paisa

    total = outstanding_total_paisa(db, merchant_id=merchant_id)
    return {
        "total_outstanding_paisa": total,
        "total_outstanding_display": format_pkr(total),
        "currency": "PKR",
    }


def tool_top_debtor(db: Session, merchant_id: str = "demo") -> dict[str, Any]:
    row = top_debtor_row(db, merchant_id=merchant_id)
    if row is None or not (row.outstanding or 0):
        return {"name": None, "outstanding_paisa": 0, "outstanding_display": format_pkr(0), "oldest_unpaid": None}
    return {
        "customer_id": row.customer_id,
        "name": row.name,
        "outstanding_paisa": int(row.outstanding),
        "outstanding_display": format_pkr(int(row.outstanding)),
        "oldest_unpaid": row.oldest_unpaid.isoformat() if row.oldest_unpaid else None,
    }


def _month_sales(db: Session, month: str, merchant_id: str = "demo") -> dict[str, Any]:
    start, end = month_bounds(month)
    total = sum_events(db, *SALE_TYPES, start=start, end=end, merchant_id=merchant_id)
    cash = sum_events(db, EventType.cash_sale.value, start=start, end=end, merchant_id=merchant_id)
    credit = sum_events(db, EventType.credit_sale.value, start=start, end=end, merchant_id=merchant_id)
    return {
        "month": month,
        "sales_paisa": total,
        "sales_display": format_pkr(total),
        "cash_sales_paisa": cash,
        "cash_sales_display": format_pkr(cash),
        "credit_sales_paisa": credit,
        "credit_sales_display": format_pkr(credit),
    }


def tool_monthly_sales(db: Session, month_arg: Any, today: date, merchant_id: str = "demo") -> dict[str, Any]:
    return _month_sales(db, _valid_month(month_arg, today), merchant_id=merchant_id)


def tool_sales_comparison(db: Session, month_arg: Any, today: date, merchant_id: str = "demo") -> dict[str, Any]:
    month = _valid_month(month_arg, today)
    current = _month_sales(db, month, merchant_id=merchant_id)
    previous = _month_sales(db, prev_month_key(month), merchant_id=merchant_id)
    delta = current["sales_paisa"] - previous["sales_paisa"]
    change_pct = round(delta / previous["sales_paisa"] * 100, 1) if previous["sales_paisa"] else None
    return {
        "current": current,
        "previous": previous,
        "delta_paisa": delta,
        "delta_display": format_pkr(abs(delta)),
        "direction": "up" if delta > 0 else ("down" if delta < 0 else "same"),
        "change_pct": change_pct,
    }


def tool_customer_outstanding(db: Session, name: Any, merchant_id: str = "demo") -> dict[str, Any]:
    if not isinstance(name, str) or not name.strip():
        return {"status": "missing_name", "suggestions": SUGGESTIONS}
    customer = find_customer_by_name(db, name, merchant_id=merchant_id)
    if customer is None:
        from app.services.ledger import normalize_name

        normalized = normalize_name(name)
        candidates = [
            c.display_name
            for c in db.query(Customer)
            .filter(Customer.merchant_id == merchant_id, Customer.name_normalized.like(f"%{normalized}%"))
            .limit(5)
            .all()
        ]
        if not candidates:
            candidates = [
                c.display_name
                for c in db.query(Customer)
                .filter(Customer.merchant_id == merchant_id)
                .order_by(Customer.display_name)
                .limit(10)
                .all()
            ]
        return {"status": "not_found", "searched": name, "candidates": candidates}
    outstanding = customer_outstanding_paisa(db, customer.id)
    oldest = customer_oldest_unpaid(db, customer.id)
    return {
        "status": "ok",
        "customer_id": customer.id,
        "name": customer.display_name,
        "outstanding_paisa": outstanding,
        "outstanding_display": format_pkr(outstanding),
        "oldest_unpaid": oldest.isoformat() if oldest else None,
    }


def run_tool(db: Session, tool: str, args: dict[str, Any], today: date, merchant_id: str = "demo") -> dict[str, Any]:
    """Execute a tool by name. Unknown tools return an explicit unknown status."""
    if tool == "total_outstanding":
        return tool_total_outstanding(db, merchant_id=merchant_id)
    if tool == "top_debtor":
        return tool_top_debtor(db, merchant_id=merchant_id)
    if tool == "monthly_sales":
        return tool_monthly_sales(db, args.get("month"), today, merchant_id=merchant_id)
    if tool == "sales_comparison":
        return tool_sales_comparison(db, args.get("month"), today, merchant_id=merchant_id)
    if tool == "customer_outstanding":
        return tool_customer_outstanding(db, args.get("name"), merchant_id=merchant_id)
    return {
        "status": "unknown_tool",
        "supported_tools": list(SUPPORTED_TOOLS),
        "suggestions": SUGGESTIONS,
    }
