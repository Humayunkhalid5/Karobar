"""Deterministic demo provider — the always-available floor of the fallback chain.

When no API keys are configured (or every real provider fails), the product still
runs end-to-end: this provider answers with rule-based extraction, keyword intent
matching, and templated text. It never raises, so the demo can never be fully
blocked by provider outages.
"""
from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Any

from app.ai.base import ExtractionResult, TextResult, ToolCall, TranscriptResult
from app.schemas.events import EventType, PaymentStatus
from app.services.money import format_pkr

_DEMO_TRANSCRIPT = (
    "Ahmed ne aaj paanch hazaar ka maal udhaar liya. Kal 1200 ki cash sale hui "
    "aur bijli ka 3500 ka bill bhi diya."
)

_MULTIPLIERS = {
    "hazaar": 1000, "hazar": 1000, "hezar": 1000, "hazār": 1000,
    "k": 1000, "sau": 100, "hundred": 100, "thousand": 1000,
    "lakh": 100000, "lac": 100000, "crore": 10000000,
}
_WORD_NUMBERS = {
    "ek": 1, "do": 2, "teen": 3, "char": 4, "chaar": 4, "panch": 5, "paanch": 5,
    "chah": 6, "cheh": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "bees": 20, "pachas": 50, "sath": 60, "assi": 80, "nabbe": 90,
}

_PAYMENT_PATTERNS = ("de diye", "wapas", "waapas", "waapsi", "return kar", "chuka", "clear kar", "jama kiya", "jama kar", "paid")
_CREDIT_PATTERNS = ("udhaar", "udhar", "baad mein", "baad main", "qarz par", "on credit")
_EXPENSE_PATTERNS = (
    "bill", "kharch", "kharcha", "kiraya", "rent", "bijli", "stock", "saman kharida",
    "maal kharida", "purchase", "salary", "wages", "mazdoori", "petrol", "diesel", "gas ka",
)
_CASH_PATTERNS = ("cash sale", "cash mila", "cash bikri", "cash mein", "cash me", "for cash")
_NOT_NAMES = {"main", "hum", "aaj", "kal", "parso", "bhai", "ji", "sab"}


def _parse_amount_rupees(text: str) -> float | None:
    t = text.lower().replace(",", "")
    # numeric with multiplier: "5 hazaar", "12.5 lakh", "80k"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(hazaar|hazar|hezar|sau|lakh|lac|crore|thousand|hundred|k)\b", t)
    if m:
        return float(m.group(1)) * _MULTIPLIERS[m.group(2)]
    # plain numeric: "5000", "2500 rupay"
    m = re.search(r"\b(\d+(?:\.\d+)?)\b", t)
    if m:
        return float(m.group(1))
    # word numbers with multiplier: "paanch hazaar"
    m = re.search(
        r"\b(ek|do|teen|char|chaar|panch|paanch|chah|cheh|saat|aath|nau|das|bees|pachas)\s+(hazaar|hazar|hezar|sau|lakh|lac|crore)\b",
        t,
    )
    if m:
        return float(_WORD_NUMBERS[m.group(1)] * _MULTIPLIERS[m.group(2)])
    return None


def _parse_counterparty(text: str) -> str | None:
    # "Main ne Ahmed ko ..." -> the receiver of goods/payer is Ahmed
    m = re.search(r"\b[A-Za-z]+\s+ne\s+([A-Za-z][a-z]+)\s+ko\b", text)
    if m and m.group(1).lower() not in _NOT_NAMES:
        return m.group(1).title()
    # "Ahmed ne ..." -> the actor
    m = re.search(r"\b([A-Za-z][a-z]+)\s+ne\b", text)
    if m and m.group(1).lower() not in _NOT_NAMES:
        return m.group(1).title()
    return None


def _parse_occurred_at(text: str, today: date) -> date:
    t = text.lower()
    if "parso" in t:
        return today - timedelta(days=2)
    if "kal" in t or "yesterday" in t:
        return today - timedelta(days=1)
    if "pichle hafte" in t or "last week" in t:
        return today - timedelta(days=7)
    if "pichle mahine" in t or "last month" in t:
        return today - timedelta(days=30)
    return today  # "aaj" or unspecified


class DemoProvider:
    name = "demo"

    async def ping(self) -> None:
        return None

    async def transcribe_audio(self, audio: bytes, mime: str, *, repair_hint: str = "") -> TranscriptResult:
        return TranscriptResult(text=_DEMO_TRANSCRIPT)

    async def extract_event_from_text(self, text: str, today: date, *, repair_hint: str = "") -> ExtractionResult:
        t = text.lower()
        event_type: EventType | None = None
        if any(p in t for p in _PAYMENT_PATTERNS):
            event_type = EventType.payment_received
        elif any(p in t for p in _CREDIT_PATTERNS):
            event_type = EventType.credit_sale
        elif any(p in t for p in _EXPENSE_PATTERNS):
            event_type = EventType.expense
        elif any(p in t for p in _CASH_PATTERNS):
            event_type = EventType.cash_sale

        amount = _parse_amount_rupees(t)
        counterparty = _parse_counterparty(text)
        occurred = _parse_occurred_at(text, today)
        status = PaymentStatus.outstanding if event_type == EventType.credit_sale else PaymentStatus.paid
        confidence = 0.75 if event_type is not None and amount is not None else 0.4
        notes = None if confidence == 0.75 else "Demo mode: details check kar ke confirm karein."
        return ExtractionResult(
            event_type=event_type,
            counterparty=counterparty,
            amount_rupees=amount,
            occurred_at=occurred,
            payment_status=status,
            confidence=confidence,
            notes=notes,
        )

    async def extract_event_from_image(self, image: bytes, mime: str, today: date, *, repair_hint: str = "") -> ExtractionResult:
        return ExtractionResult(
            event_type=EventType.expense,
            counterparty=None,
            amount_rupees=None,
            occurred_at=today,
            payment_status=PaymentStatus.paid,
            confidence=0.3,
            notes="Demo mode: receipt image analyse nahi hui — total amount khud check kar ke darj karein.",
        )

    async def interpret_question(self, question: str, today: date, *, repair_hint: str = "") -> ToolCall:
        q = question.lower()
        if any(k in q for k in ("compare", "comparison", "farq", "mukable", "mukabla", "versus", " vs ", "difference")):
            return ToolCall(tool="sales_comparison", args={})
        if any(k in q for k in ("top", "sab se zyada", "sabse zyada", "zyada udhaar", "sab se bara", "sabse bara", "most")):
            return ToolCall(tool="top_debtor", args={})
        m = re.search(r"\b([a-z]+)\s+(?:ne\s+)?(?:ka|ki)\s+(?:udhaar|qarz|paisay|paise|baqaya|balance)", q)
        if m and m.group(1) not in ("kitna", "kya", "total", "kul", "sab", "sabki", "sabka", "mere", "mera", "aap"):
            return ToolCall(tool="customer_outstanding", args={"name": m.group(1).title()})
        if any(k in q for k in ("udhaar", "outstanding", "qarz", "receivable", "pending")):
            return ToolCall(tool="total_outstanding", args={})
        if any(k in q for k in ("sale", "sales", "bikri", "revenue", "month", "mahine")):
            return ToolCall(tool="monthly_sales", args={})
        return ToolCall(tool="unsupported", args={})

    async def compose_answer(self, question: str, tool_name: str, tool_result: dict[str, Any], *, repair_hint: str = "") -> TextResult:
        if tool_name == "total_outstanding":
            text = f"Aap ka total outstanding udhaar abhi {tool_result.get('total_outstanding_display', 'Rs 0')} hai."
        elif tool_name == "top_debtor":
            name = tool_result.get("name")
            if name:
                text = f"{name} ko sab se zyada udhaar hai: {tool_result.get('outstanding_display', 'Rs 0')}"
                oldest = tool_result.get("oldest_unpaid")
                if oldest:
                    text += f" (sab purani adaaigi {oldest} se pending hai)."
                else:
                    text += "."
            else:
                text = "Abhi kisi ka udhaar pending nahi hai."
        elif tool_name == "monthly_sales":
            text = (
                f"{tool_result.get('month', 'is month')} mein aap ki total sales "
                f"{tool_result.get('sales_display', 'Rs 0')} thi "
                f"(cash {tool_result.get('cash_sales_display', 'Rs 0')} + udhaar {tool_result.get('credit_sales_display', 'Rs 0')})."
            )
        elif tool_name == "sales_comparison":
            current = tool_result.get("current", {})
            previous = tool_result.get("previous", {})
            direction = tool_result.get("direction")
            word = {"up": "zyada", "down": "kam", "same": "barabar"}.get(direction, "barabar")
            pct = tool_result.get("change_pct")
            pct_text = f" ({abs(pct)}% {word})" if pct is not None else ""
            text = (
                f"{current.get('month', 'is month')} ki sales {current.get('sales_display', 'Rs 0')} thi, "
                f"jabke {previous.get('month', 'pichle month')} ki sales {previous.get('sales_display', 'Rs 0')} thi{pct_text}."
            )
        elif tool_name == "customer_outstanding":
            status = tool_result.get("status")
            if status == "ok":
                text = f"{tool_result.get('name')} ka outstanding udhaar {tool_result.get('outstanding_display', 'Rs 0')} hai."
            elif status == "not_found":
                candidates = ", ".join(tool_result.get("candidates", []))
                text = f"Is naam ka koi customer record mein nahi mila. Record mein maujood customers: {candidates}."
            elif status == "missing_name":
                text = "Kis customer ke baare mein poochhna hai? Naam bata dein."
            else:
                text = "Customer ka naam saaf tarah se bata dein."
        else:  # unsupported
            suggestions = tool_result.get("suggestions", [])
            lines = "\n".join(f"- {s}" for s in suggestions)
            text = f"Maazrat, abhi main is sawal ka jawab nahi de sakti. Main in sawalon ka jawab de sakti hoon:\n{lines}"
        return TextResult(text=text)

    async def draft_reminder(
        self,
        debtor: str,
        outstanding_paisa: int,
        oldest_unpaid: date | None,
        *,
        tone: str = "friendly",
        repair_hint: str = "",
    ) -> TextResult:
        amount = format_pkr(outstanding_paisa)
        since = f" (pehli adaaigi {oldest_unpaid} se)" if oldest_unpaid else ""
        if tone == "firm":
            text = (
                f"Assalam o Alaikum {debtor}, aap ka {amount} ka udhaar kaafi din se pending hai{since}. "
                f"Kripya jald adaa kar dein taake karobaar chalta rahe. Shukriya."
            )
        else:
            text = (
                f"Assalam o Alaikum {debtor} bhai, umeed hai aap khairiyat se hain. "
                f"Aap ka hamare record ke mutabiq {amount} ka udhaar pending hai{since}. "
                f"Jab moqa mile to ada kar dein — shukriya!"
            )
        return TextResult(text=text)
