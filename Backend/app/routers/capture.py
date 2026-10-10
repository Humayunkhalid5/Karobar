"""Voice / text / receipt capture: transcribe and extract into reviewable drafts.

Nothing in this module writes to the ledger — a draft is only saved when the
merchant confirms it via POST /api/events.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.ai import get_adapter
from app.ai.base import ProviderError
from app.auth import get_merchant_id
from app.config import settings
from app.db import get_db, pkt_today
from app.errors import AIUnavailableError, DomainValidationError
from app.schemas.capture import DraftEvent, ExtractTextRequest, TranscriptResponse
from app.schemas.events import SourceType
from app.services.ledger import build_draft

router = APIRouter(prefix="/capture", tags=["capture"])

MAX_AUDIO_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

_IMAGE_EXTS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


def _mime(file: UploadFile) -> str:
    return (file.content_type or "").split(";")[0].strip().lower()


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(file: UploadFile = File(..., description="Audio recording (webm, m4a, mp3, wav, ogg)")):
    audio = await file.read()
    if not audio:
        raise DomainValidationError("audio file is empty")
    if len(audio) > MAX_AUDIO_BYTES:
        raise DomainValidationError("audio file too large (max 20 MB)")
    mime = _mime(file)
    if not (mime.startswith("audio/") or mime == "video/webm"):
        raise DomainValidationError(f"unsupported audio content type: {mime or 'unknown'}")
    try:
        result = await get_adapter().transcribe_audio(audio, mime)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc
    return TranscriptResponse(transcript=result.text, provider=result.provider)


@router.post("/extract", response_model=DraftEvent)
async def extract_text(
    payload: ExtractTextRequest,
    db: Session = Depends(get_db),
    source: str = Query("voice", pattern="^(voice|manual)$", description="Where the text came from"),
    merchant_id: str = Depends(get_merchant_id),
):
    try:
        extraction = await get_adapter().extract_event_from_text(payload.text, pkt_today())
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc
    return build_draft(
        db,
        extraction,
        source_type=SourceType.voice if source == "voice" else SourceType.manual,
        raw_input=payload.text,
        evidence_filename=None,
        merchant_id=merchant_id,
    )


@router.post("/extract-receipt", response_model=DraftEvent)
async def extract_receipt(
    db: Session = Depends(get_db),
    file: UploadFile = File(..., description="Receipt photo (jpg, png, webp, heic)"),
    merchant_id: str = Depends(get_merchant_id),
):
    image = await file.read()
    if not image:
        raise DomainValidationError("image file is empty")
    if len(image) > MAX_IMAGE_BYTES:
        raise DomainValidationError("image file too large (max 10 MB)")
    mime = _mime(file)
    if mime not in _IMAGE_EXTS:
        raise DomainValidationError(f"unsupported image content type: {mime or 'unknown'} (use jpg, png, webp or heic)")

    # Evidence is kept before AI runs: even a failed extraction leaves the photo saved.
    filename = f"{uuid.uuid4().hex}{_IMAGE_EXTS[mime]}"
    (settings.uploads_dir / filename).write_bytes(image)

    try:
        extraction = await get_adapter().extract_event_from_image(image, mime, pkt_today())
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc
    return build_draft(
        db,
        extraction,
        source_type=SourceType.receipt,
        raw_input=None,
        evidence_filename=filename,
        merchant_id=merchant_id,
    )
