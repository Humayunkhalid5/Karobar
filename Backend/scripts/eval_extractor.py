"""Extractor evaluation harness: run sample Roman-Urdu utterances through the live chain.

Compares AI extraction against expected fields so prompt changes can be scored
before shipping. Uses whatever provider chain is configured (.env / environment);
with AI_PROVIDER=demo it validates the demo parser instead (useful in CI).

Usage (from the backend root):
    python scripts/eval_extractor.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# (utterance, expected_event_type, expected_amount_rupees, expected_counterparty)
SAMPLES: list[tuple[str, str, float | None, str | None]] = [
    ("Ahmed ne aaj paanch hazaar ka maal udhaar liya", "credit_sale", 5000, "Ahmed"),
    ("Kal 2500 ki cash sale hui", "cash_sale", 2500, None),
    ("Bijli ka bill 3500 diya", "expense", 3500, None),
    ("Bilal ne 12000 wapas kar diye", "payment_received", 12000, "Bilal"),
    ("Main ne Usman ko das hazaar ka qarz par maal diya", "credit_sale", 10000, "Usman"),
    ("Pichle hafte stock kharidne pe 80 hazar kharch hue", "expense", 80000, None),
    ("Tariq ne 2 lakh ka udhaar chuka diya", "payment_received", 200000, "Tariq"),
    ("Aaj ka total cash 15500 tha", "cash_sale", 15500, None),
    ("Kamran ke 4500 wapas aa gaye", "payment_received", 4500, "Kamran"),
    ("Shop ka kiraya 30000 diya", "expense", 30000, None),
]


def _mark(ok: bool) -> str:
    return "PASS" if ok else "FAIL"


async def main() -> int:
    from app.ai import get_adapter
    from app.db import pkt_today

    adapter = get_adapter()
    print(f"provider chain: {' -> '.join(adapter.chain_names())}\n")

    field_checks = 0
    field_passes = 0
    perfect = 0

    for text, want_type, want_amount, want_name in SAMPLES:
        result = await adapter.extract_event_from_text(text, pkt_today())

        checks = {
            "type": (result.event_type.value if result.event_type else None) == want_type,
            "amount": result.amount_rupees == want_amount,
            "name": (result.counterparty or None) == want_name,
        }
        field_checks += len(checks)
        field_passes += sum(checks.values())
        if all(checks.values()):
            perfect += 1

        summary = " ".join(f"{name}:{_mark(ok)}" for name, ok in checks.items())
        print(f"[{_mark(all(checks.values()))}] {text}")
        print(f"      -> type={result.event_type.value if result.event_type else None} "
              f"amount={result.amount_rupees} name={result.counterparty!r} ({summary})")

    print(f"\nsamples: {len(SAMPLES)}  perfect: {perfect}/{len(SAMPLES)}  "
          f"field accuracy: {field_passes}/{field_checks} "
          f"({field_passes / field_checks * 100:.1f}%)")
    return 0 if field_passes == field_checks else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
