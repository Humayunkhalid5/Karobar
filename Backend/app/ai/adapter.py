"""Fallback chain: Groq -> Gemini -> Demo, with one JSON-repair retry per provider.

Per-call semantics: a single Groq failure (rate limit, timeout) mid-demo
transparently routes that one request to Gemini; malformed model JSON gets one
repair retry on the same provider before moving down the chain. The Demo
provider never fails, so the product always responds.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from app.ai.base import ProviderError
from app.ai.demo_provider import DemoProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.groq_provider import GroqProvider
from app.config import settings

REPAIR_HINT = (
    "IMPORTANT: Your previous reply was not a single valid JSON object. "
    "Reply again with ONLY the JSON object — no explanations, no markdown fences."
)


class FallbackAdapter:
    def __init__(self, providers: list[Any]) -> None:
        self.providers = providers or [DemoProvider()]

    def chain_names(self) -> list[str]:
        return [p.name for p in self.providers]

    async def _call(self, method_name: str, /, *args: Any, **kwargs: Any) -> Any:
        last_error: Exception = ProviderError("no provider configured")
        for provider in self.providers:
            method = getattr(provider, method_name)
            for attempt in (1, 2):
                call_kwargs = dict(kwargs)
                if attempt == 2:
                    call_kwargs["repair_hint"] = REPAIR_HINT
                try:
                    result = await method(*args, **call_kwargs)
                except ValueError as exc:
                    # malformed model output -> retry same provider once with repair hint
                    last_error = exc
                    continue
                except ProviderError as exc:
                    # provider unavailable -> next provider immediately
                    last_error = exc
                    break
                result.provider = provider.name
                return result
        raise ProviderError(f"all providers failed for '{method_name}': {last_error}")

    # --- capability facade ---------------------------------------------------

    async def transcribe_audio(self, audio: bytes, mime: str):
        return await self._call("transcribe_audio", audio, mime)

    async def extract_event_from_text(self, text: str, today: date):
        return await self._call("extract_event_from_text", text, today)

    async def extract_event_from_image(self, image: bytes, mime: str, today: date):
        return await self._call("extract_event_from_image", image, mime, today)

    async def interpret_question(self, question: str, today: date):
        return await self._call("interpret_question", question, today)

    async def compose_answer(self, question: str, tool_name: str, tool_result: dict[str, Any]):
        return await self._call("compose_answer", question, tool_name, tool_result)

    async def draft_reminder(self, debtor: str, outstanding_paisa: int, oldest_unpaid: date | None, *, tone: str = "friendly"):
        return await self._call("draft_reminder", debtor, outstanding_paisa, oldest_unpaid, tone=tone)


_ADAPTER: FallbackAdapter | None = None


def get_adapter() -> FallbackAdapter:
    """Build (once) the provider chain from settings. Demo is always the floor."""
    global _ADAPTER
    if _ADAPTER is None:
        providers: list[Any] = []
        for name in settings.provider_chain():
            if name == "groq":
                providers.append(GroqProvider())
            elif name == "gemini":
                providers.append(GeminiProvider())
            elif name == "demo":
                providers.append(DemoProvider())
        _ADAPTER = FallbackAdapter(providers)
    return _ADAPTER


def reset_adapter() -> None:
    """Used by tests / config reloads."""
    global _ADAPTER
    _ADAPTER = None
