"""Deterministic demo dataset: ~3.5 months of a kiryana store's activity.

All dates are relative to 'today' (PKT) so the demo always looks current. Amounts
are given in rupees here and converted to paisa on insert. There is no
randomness — the same 'today' always produces the same ledger, which keeps every
demo number explainable.

Intended headline numbers (see tests/test_ask.py):
- Total outstanding udhaar: Rs 100,000
- Top debtor: Ahmed with Rs 58,500 (oldest unpaid ~45 days ago -> overdue)
- Credit sales total Rs 198,000, recovered Rs 98,000 (recovery ~49.5%)
"""
from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session

from app.db import pkt_today
from app.models import BusinessEvent, Customer
from app.services.ledger import recompute_customer_settlement
from app.services.money import rupees_to_paisa

_CUSTOMER_NAMES = ("Ahmed", "Bilal", "Usman", "Kamran", "Tariq")

# (days_ago, event_type, customer, amount_rupees, note)
_EVENTS: list[tuple[int, str, str | None, int, str | None]] = [
    # --- oldest month: cash sales ---
    (95, "cash_sale", None, 42000, None),
    (92, "cash_sale", None, 18500, None),
    (88, "cash_sale", None, 55000, None),
    (84, "cash_sale", None, 31000, None),
    (81, "cash_sale", None, 26500, None),
    (77, "cash_sale", None, 62000, None),
    (73, "cash_sale", None, 22500, None),
    (68, "cash_sale", None, 48000, None),
    # --- expenses (older) ---
    (90, "expense", None, 8500, "Bijli ka bill"),
    (83, "expense", None, 95000, "Stock purchase — wholesale market"),
    (75, "expense", None, 30000, "Shop rent"),
    (66, "expense", None, 7800, "Bijli ka bill"),
    # --- credit sales (older) ---
    (70, "credit_sale", "Tariq", 6000, None),
    (60, "credit_sale", "Ahmed", 15000, None),
    (55, "credit_sale", "Bilal", 20000, None),
    (50, "credit_sale", "Kamran", 10000, None),
    # --- middle month: cash sales ---
    (57, "cash_sale", None, 38000, None),
    (54, "cash_sale", None, 21500, None),
    (50, "cash_sale", None, 58000, None),
    (46, "cash_sale", None, 33000, None),
    (43, "cash_sale", None, 27500, None),
    (39, "cash_sale", None, 66000, None),
    (35, "cash_sale", None, 24000, None),
    (31, "cash_sale", None, 51000, None),
    # --- expenses (middle) ---
    (58, "expense", None, 88000, "Stock purchase — wholesale market"),
    (52, "expense", None, 8200, "Bijli ka bill"),
    (45, "expense", None, 30000, "Shop rent"),
    (38, "expense", None, 6500, "Petrol"),
    (33, "expense", None, 92000, "Stock purchase — wholesale market"),
    # --- credit sales (middle) ---
    (45, "credit_sale", "Ahmed", 30000, None),
    (40, "credit_sale", "Tariq", 14000, None),
    (35, "credit_sale", "Usman", 18000, None),
    # --- payments (middle) ---
    (30, "payment_received", "Ahmed", 15000, None),
    (25, "payment_received", "Bilal", 12000, None),
    (22, "payment_received", "Kamran", 7000, None),
    # --- recent month: cash sales ---
    (26, "cash_sale", None, 41000, None),
    (23, "cash_sale", None, 23500, None),
    (19, "cash_sale", None, 59000, None),
    (16, "cash_sale", None, 34000, None),
    (13, "cash_sale", None, 28000, None),
    (10, "cash_sale", None, 68000, None),
    (7, "cash_sale", None, 25000, None),
    (4, "cash_sale", None, 53000, None),
    # --- expenses (recent) ---
    (27, "expense", None, 7900, "Bijli ka bill"),
    (21, "expense", None, 90000, "Stock purchase — wholesale market"),
    (15, "expense", None, 30000, "Shop rent"),
    (9, "expense", None, 8100, "Bijli ka bill"),
    (6, "expense", None, 6000, "Petrol"),
    # --- credit sales (recent) ---
    (20, "credit_sale", "Ahmed", 25000, None),
    (16, "credit_sale", "Kamran", 22000, None),
    (12, "credit_sale", "Bilal", 9500, None),
    # --- payments (recent) ---
    (20, "payment_received", "Tariq", 14000, None),
    (10, "payment_received", "Usman", 18000, None),
    (5, "payment_received", "Ahmed", 10000, None),
    (5, "payment_received", "Kamran", 8000, None),
    (5, "payment_received", "Tariq", 6000, None),
    (3, "payment_received", "Bilal", 8000, None),
    # --- current days ---
    (2, "cash_sale", None, 45000, None),
    (1, "cash_sale", None, 22000, None),
    (1, "expense", None, 65000, "Stock purchase — wholesale market"),
    (0, "cash_sale", None, 51000, None),
    # --- credit sales (current) ---
    (8, "credit_sale", "Ahmed", 13500, None),
    (3, "credit_sale", "Kamran", 15000, None),
]


def load_seed(db: Session, merchant_id: str = "demo") -> dict[str, int]:
    """Wipe the merchant's ledger and load the demo dataset. Returns row counts."""
    today = pkt_today()
    db.query(BusinessEvent).filter(BusinessEvent.merchant_id == merchant_id).delete()
    db.query(Customer).filter(Customer.merchant_id == merchant_id).delete()
    db.flush()

    customers = {}
    for name in _CUSTOMER_NAMES:
        customer = Customer(merchant_id=merchant_id, name_normalized=name.lower(), display_name=name)
        db.add(customer)
        customers[name] = customer
    db.flush()

    events = 0
    for days_ago, event_type, customer, rupees, note in _EVENTS:
        db.add(
            BusinessEvent(
                merchant_id=merchant_id,
                event_type=event_type,
                customer_id=customers[customer].id if customer else None,
                counterparty_raw=customer,
                amount_paisa=rupees_to_paisa(rupees),
                occurred_at=today - timedelta(days=days_ago),
                payment_status="outstanding" if event_type == "credit_sale" else "paid",
                source_type="seed",
                ai_provider="seed",
                verification_status="confirmed",
                notes=note,
            )
        )
        events += 1
    db.flush()

    # Udhaar settlement is always recomputed deterministically, never seeded by hand.
    for customer in customers.values():
        recompute_customer_settlement(db, customer.id)
    db.commit()
    return {"customers": len(customers), "events": events}
