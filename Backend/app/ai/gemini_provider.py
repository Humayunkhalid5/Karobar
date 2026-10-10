"""Gemini fallback provider: one multimodal model for text, audio, and vision."""
from __future__ import annotations

import asyncio
import io
import logging
from datetime import date
from typing import Any

from google import genai
from google.genai import types
from PIL import Image

from app.ai import prompts
from app.ai.base import (
    ExtractionResult,
    ProviderError,
    TextResult,
    ToolCall,
    TranscriptResult,
    normalize_extraction,
    normalize_tool_call,
    parse_json_object,
)
from app.config import settings

logger = logging.getLogger(__name__)

# Max dimension and JPEG quality for images sent to Gemini.
# Keeps API calls fast even with large phone-camera photos.
_MAX_IMAGE_PX = 1024
_JPEG_QUALITY = 80


def _compress_image(image: bytes, mime: str) -> tuple[bytes, str]:
    """Resize large images and convert to JPEG for faster API calls."""
    try:
        img = Image.open(io.BytesIO(image))
        # Convert to RGB (required for JPEG — handles RGBA/PNG/WebP/HEIC)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        # Resize if any dimension exceeds max
        w, h = img.size
        if max(w, h) > _MAX_IMAGE_PX:
            ratio = _MAX_IMAGE_PX / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
            logger.info("Image resized from %dx%d to %dx%d", w, h, img.size[0], img.size[1])
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=_JPEG_QUALITY, optimize=True)
        compressed = buf.getvalue()
        logger.info("Image compressed: %d KB -> %d KB", len(image) // 1024, len(compressed) // 1024)
        return compressed, "image/jpeg"
    except Exception as exc:
        # If compression fails, send original
        logger.warning("Image compression failed, sending original: %s", exc)
        return image, mime


class GeminiProvider:
    name = "gemini"

    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)

    # --- internals ---------------------------------------------------------

    async def _generate(
        self,
        system: str,
        parts: list[types.Part],
        *,
        json_mode: bool = False,
        repair_hint: str = "",
    ) -> str:
        if repair_hint:
            parts = [*parts, types.Part(text=f"\n\n{repair_hint}")]
        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.1,
            response_mime_type="application/json" if json_mode else None,
        )
        try:
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=parts,
                    config=config,
                ),
                timeout=settings.ai_timeout_seconds,
            )
        except Exception as exc:
            raise ProviderError(f"gemini call failed: {exc}") from exc
        text = (response.text or "").strip()
        if not text:
            raise ValueError("empty response from gemini")
        return text

    async def ping(self) -> None:
        try:
            await self._generate("You are a health check.", [types.Part(text="Reply with the single word OK.")])
        except ValueError as exc:
            raise ProviderError(f"gemini ping failed: {exc}") from exc

    # --- capabilities ------------------------------------------------------

    async def transcribe_audio(self, audio: bytes, mime: str, *, repair_hint: str = "") -> TranscriptResult:
        parts = [
            types.Part(text="Transcribe this Urdu/Roman Urdu voice recording from a Pakistani shopkeeper. Keep numbers as spoken."),
            types.Part(inline_data=types.Blob(data=audio, mime_type=(mime or "audio/webm").split(";")[0])),
        ]
        text = await self._generate(prompts.TRANSCRIPTION_SYSTEM, parts, repair_hint=repair_hint)
        return TranscriptResult(text=text)

    async def extract_event_from_text(self, text: str, today: date, *, repair_hint: str = "") -> ExtractionResult:
        raw = await self._generate(
            prompts.extraction_system(today), [types.Part(text=text)], json_mode=True, repair_hint=repair_hint
        )
        return normalize_extraction(parse_json_object(raw))

    async def extract_event_from_image(self, image: bytes, mime: str, today: date, *, repair_hint: str = "") -> ExtractionResult:
        compressed, compressed_mime = _compress_image(image, mime)
        parts = [
            types.Part(text=prompts.RECEIPT_USER_INSTRUCTION),
            types.Part(inline_data=types.Blob(data=compressed, mime_type=compressed_mime)),
        ]
        raw = await self._generate(
            prompts.receipt_system(today), parts, json_mode=True, repair_hint=repair_hint
        )
        return normalize_extraction(parse_json_object(raw))

    async def interpret_question(self, question: str, today: date, *, repair_hint: str = "") -> ToolCall:
        raw = await self._generate(
            prompts.question_system(today), [types.Part(text=question)], json_mode=True, repair_hint=repair_hint
        )
        return normalize_tool_call(parse_json_object(raw))

    async def compose_answer(self, question: str, tool_name: str, tool_result: dict[str, Any], *, repair_hint: str = "") -> TextResult:
        raw = await self._generate(
            prompts.answer_system(question, tool_name, tool_result),
            [types.Part(text="Write the answer now.")],
            repair_hint=repair_hint,
        )
        return TextResult(text=raw)

    async def draft_reminder(
        self,
        debtor: str,
        outstanding_paisa: int,
        oldest_unpaid: date | None,
        *,
        tone: str = "friendly",
        repair_hint: str = "",
    ) -> TextResult:
        raw = await self._generate(
            prompts.reminder_system(debtor, outstanding_paisa, oldest_unpaid, tone),
            [types.Part(text="Write the reminder message now.")],
            repair_hint=repair_hint,
        )
        return TextResult(text=raw)
