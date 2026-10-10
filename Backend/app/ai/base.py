"""Provider-agnostic AI layer: shared result models, JSON parsing, and the provider protocol.

Business logic never imports a concrete provider; it talks to the FallbackAdapter,
which owns the Groq -> Gemini -> Demo chain.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime
from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel

from app.schemas.events import EventType, PaymentStatus

VALID_EVENT_TYPES = {t.value for t in EventType}
VALID_PAYMENT_STATUSES = {s.value for s in PaymentStatus}

_THINK_OPEN = "<" + "think" + ">"
_THINK_CLOSE = "</" + "think" + ">"
_THINK_RE = re.compile(re.escape(_THINK_OPEN) + ".*?" + re.escape(_THINK_CLOSE), re.DOTALL | re.IGNORECASE)
_FENCE_RE = re.compile(r"```[a-zA-Z]*\s*(.*?)```", re.DOTALL)


class ProviderError(Exception):
    """A provider could not be reached or rejected the request (network, auth, rate limit, timeout)."""


class TranscriptResult(BaseModel):
    provider: str = ""
    text: str = ""


class ExtractionResult(BaseModel):
    provider: str = ""
    event_type: EventType | None = None
    counterparty: str | None = None
    amount_rupees: float | None = None
    occurred_at: date | None = None
    payment_status: PaymentStatus | None = None
    confidence: float | None = None
    notes: str | None = None


class ToolCall(BaseModel):
    provider: str = ""
    tool: str = "unsupported"
    args: dict[str, Any] = {}


class TextResult(BaseModel):
    provider: str = ""
    text: str = ""


def strip_model_wrappers(text: str) -> str:
    """Remove <think> reasoning blocks and markdown code fences models add around JSON."""
    text = _THINK_RE.sub("", text or "")
    fence = _FENCE_RE.search(text)
    if fence:
        text = fence.group(1)
    return text.strip()


def parse_json_object(text: str) -> dict[str, Any]:
    """Extract the first JSON object from a model response. Raises ValueError if none found."""
    cleaned = strip_model_wrappers(text)
    try:
        obj = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object found in model output")
        try:
            obj = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as exc:
            raise ValueError(f"model output is not valid JSON: {exc}") from exc
    if not isinstance(obj, dict):
        raise ValueError("model output is not a JSON object")
    return obj


def normalize_extraction(obj: dict[str, Any]) -> ExtractionResult:
    """Normalize a parsed extraction dict into a validated ExtractionResult.

    Unknown event types, negative amounts, and unparseable dates become None —
    the deterministic layer then reports them as missing fields instead of guessing.
    """
    event_type = obj.get("event_type")
    if isinstance(event_type, str) and event_type.strip().lower() in VALID_EVENT_TYPES:
        event_type = event_type.strip().lower()
    else:
        event_type = None

    status = obj.get("payment_status")
    if isinstance(status, str) and status.strip().lower() in VALID_PAYMENT_STATUSES:
        status = status.strip().lower()
    else:
        status = None

    counterparty = obj.get("counterparty")
    if isinstance(counterparty, str):
        counterparty = counterparty.strip() or None
    else:
        counterparty = None

    notes = obj.get("notes")
    if isinstance(notes, str) and notes.strip():
        notes = notes.strip()
    else:
        notes = None

    return ExtractionResult(
        event_type=event_type,
        counterparty=counterparty,
        amount_rupees=_coerce_amount(obj.get("amount_rupees")),
        occurred_at=_coerce_date(obj.get("occurred_at")),
        payment_status=status,
        confidence=_coerce_confidence(obj.get("confidence")),
        notes=notes,
    )


def normalize_tool_call(obj: dict[str, Any]) -> ToolCall:
    """Normalize a parsed question-interpretation dict into a ToolCall."""
    tool = obj.get("tool")
    args = obj.get("args")
    if not isinstance(tool, str) or not tool.strip():
        raise ValueError("missing 'tool' in model output")
    if not isinstance(args, dict):
        args = {}
    return ToolCall(tool=tool.strip().lower(), args=args)


def _coerce_amount(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        amount = float(value)
    elif isinstance(value, str):
        try:
            amount = float(value.replace(",", "").strip())
        except ValueError:
            return None
    else:
        return None
    return amount if amount >= 0 else None


_DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y")


def _coerce_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()[:10]
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def _coerce_confidence(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        c = float(value)
    elif isinstance(value, str):
        try:
            c = float(value.strip())
        except ValueError:
            return None
    else:
        return None
    if 1 < c <= 100:  # the model sent a percentage
        c = c / 100
    return round(max(0.0, min(1.0, c)), 2)


@runtime_checkable
class AIProvider(Protocol):
    """Every provider implements the same capabilities. All methods are async."""

    name: str

    async def ping(self) -> None: ...

    async def transcribe_audio(self, audio: bytes, mime: str, *, repair_hint: str = "") -> TranscriptResult: ...

    async def extract_event_from_text(self, text: str, today: date, *, repair_hint: str = "") -> ExtractionResult: ...

    async def extract_event_from_image(self, image: bytes, mime: str, today: date, *, repair_hint: str = "") -> ExtractionResult: ...

    async def interpret_question(self, question: str, today: date, *, repair_hint: str = "") -> ToolCall: ...

    async def compose_answer(self, question: str, tool_name: str, tool_result: dict[str, Any], *, repair_hint: str = "") -> TextResult: ...

    async def draft_reminder(self, debtor: str, outstanding_paisa: int, oldest_unpaid: date | None, *, tone: str = "friendly", repair_hint: str = "") -> TextResult: ...
