"""Money helpers. All authoritative amounts are integer paisa (1 PKR = 100 paisa).

AI models return rupees; the deterministic layer converts exactly once with
rupees_to_paisa() and everything downstream is integer arithmetic.
"""
from __future__ import annotations

PAISA_PER_RUPEE = 100


def rupees_to_paisa(rupees: float) -> int:
    return int(round(rupees * PAISA_PER_RUPEE))


def format_pkr(paisa: int | float) -> str:
    paisa = int(paisa)
    if paisa % PAISA_PER_RUPEE == 0:
        return f"Rs {paisa // PAISA_PER_RUPEE:,}"
    return f"Rs {paisa / PAISA_PER_RUPEE:,.2f}"
