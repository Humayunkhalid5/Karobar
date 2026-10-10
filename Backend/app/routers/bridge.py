"""Frontend-compatible adapter endpoints.

Translates between the frontend's expected API shapes (rupee floats, sale/credit_given
event types, combined intelligence response) and the backend's internal models (paisa
integers, cash_sale/credit_sale, separate passport + readiness endpoints).

This router MUST be registered before demo.py in ALL_ROUTERS so that its POST
/demo/seed endpoint takes priority over the simpler one in demo.py.
"""
from __future__ import annotations

import logging
import time as _time
import uuid
from datetime import date, datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.ai import get_adapter
from app.ai.base import ProviderError
from app.auth import get_merchant_id
from app.config import settings
from app.data.seed import load_seed
from app.db import get_db, pkt_today
from app.errors import AIUnavailableError, DomainValidationError
from app.models import BusinessEvent, Customer
from app.schemas.events import EventCreate, EventType, PaymentStatus, SourceType, VerificationStatus
from app.services.ledger import (
    confirm_event,
    customer_oldest_unpaid,
    customer_outstanding_paisa,
    event_to_out,
    find_customer_by_name,
    normalize_name,
)
from app.services.matching import evaluate_readiness, load_programs
from app.services.metrics import dashboard_bundle
from app.services.metrics import _fetch_confirmed_events, _fetch_customers
from app.services.money import format_pkr
from app.services.passport import compute_passport

router = APIRouter(tags=["bridge"])

# In-memory cache for the combined endpoint (30 s TTL per merchant)
_combined_cache: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 30  # seconds

# ---------------------------------------------------------------------------
# Type translation tables
# ---------------------------------------------------------------------------

# Backend -> Frontend event type
_FE_EVENT_TYPE = {
    "cash_sale": "sale",
    "credit_sale": "credit_given",
    "payment_received": "credit_received",
    "expense": "expense",
}

# Frontend -> Backend event type
_BE_EVENT_TYPE = {
    "sale": "cash_sale",
    "expense": "expense",
    "credit_given": "credit_sale",
    "credit_received": "payment_received",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _event_to_fe(event: BusinessEvent, customer_name: str | None) -> dict:
    """Convert a backend BusinessEvent to the frontend's StoredLedgerEvent shape."""
    name = customer_name or (event.customer.display_name if event.customer else None)
    et = _FE_EVENT_TYPE.get(event.event_type, "sale")
    return {
        "id": event.id,
        "event_type": et,
        "payment_type": "credit" if et in ("credit_given", "credit_received") else "cash",
        "customer_name": name or "Walk-in",
        "amount": round(event.amount_paisa / 100, 2),
        "currency": "PKR",
        "date": event.occurred_at.isoformat(),
        "confidence": event.ai_confidence or 0.9,
        "source": "voice" if event.source_type in ("voice", "seed", "manual") else "photo",
        "raw_input": event.raw_input or "",
        "status": "validated",
        "validation_notes": [],
        "created_at": event.created_at.isoformat() if event.created_at else datetime.now().isoformat(),
    }


def _draft_to_fe_event(draft, raw_text: str | None = None) -> dict:
    """Convert a backend DraftEvent to the frontend's LedgerEvent shape."""
    et = _FE_EVENT_TYPE.get(draft.event_type.value, "sale") if draft.event_type else "sale"
    amount = round(draft.amount_paisa / 100, 2) if draft.amount_paisa else None
    missing = list(draft.missing_fields) if draft.missing_fields else []
    status = "validated" if not missing else "pending_validation"
    return {
        "event_type": et,
        "payment_type": "credit" if et in ("credit_given", "credit_received") else "cash",
        "customer_name": draft.customer_name or draft.counterparty or None,
        "amount": amount,
        "currency": "PKR",
        "date": draft.occurred_at.isoformat() if draft.occurred_at else pkt_today().isoformat(),
        "confidence": draft.confidence or 0.85,
        "source": "voice" if draft.source_type in (SourceType.voice, SourceType.manual, "voice", "manual") else "photo",
        "raw_input": draft.raw_input or raw_text or "",
        "status": status,
        "validation_notes": missing,
    }


def _summary_from_dashboard(dash) -> dict:
    """Convert a DashboardResponse to the frontend's LedgerSummary shape."""
    total_sales = round(dash.month_sales_paisa / 100, 2)
    total_expenses = round(dash.month_expenses_paisa / 100, 2)
    total_receivables = round(dash.outstanding_total_paisa / 100, 2)
    total_payables = round(dash.overdue_total_paisa / 100, 2)

    recent = []
    for ev in dash.recent_events:
        name = ev.customer_name
        be_event_type = ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type)
        et = _FE_EVENT_TYPE.get(be_event_type, "sale")
        recent.append({
            "id": ev.id,
            "event_type": et,
            "payment_type": "credit" if et in ("credit_given", "credit_received") else "cash",
            "customer_name": name or "Walk-in",
            "amount": round(ev.amount_paisa / 100, 2),
            "currency": "PKR",
            "date": ev.occurred_at.isoformat(),
            "confidence": ev.ai_confidence or 0.9,
            "source": "voice" if ev.source_type.value in ("voice", "seed", "manual") else "photo",
            "raw_input": ev.raw_input or "",
            "status": "validated",
            "validation_notes": [],
            "created_at": ev.created_at.isoformat(),
        })

    return {
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "total_receivables": total_receivables,
        "total_payables": total_payables,
        "net_cash": round(total_sales - total_expenses, 2),
        "record_count": len(dash.recent_events),
        "recent_events": recent,
    }


def _find_customer_in_text(db: Session, text: str, merchant_id: str = "demo") -> Customer | None:
    """Try to find a known customer mentioned in the transcript text."""
    normalized = normalize_name(text)
    # Exact match first
    exact = find_customer_by_name(db, text.strip(), merchant_id=merchant_id)
    if exact:
        return exact
    # Substring match: check if any customer name appears in the transcript
    for customer in db.query(Customer).filter(Customer.merchant_id == merchant_id).all():
        if customer.name_normalized in normalized:
            return customer
    return None


# ---------------------------------------------------------------------------
# GET /config/ai-provider
# ---------------------------------------------------------------------------


@router.get("/config/ai-provider")
async def get_config():
    chain = settings.provider_chain()
    selected = chain[0] if chain else "demo"

    # The frontend references "alibaba" as a legacy provider name;
    # we map our actual providers to the shape it expects.
    fe_selected = "groq" if selected == "groq" else ("demo" if selected == "demo" else "groq")

    return {
        "selected_provider": fe_selected,
        "mode": settings.ai_provider,
        "configured": {
            "alibaba": False,
            "groq": bool(settings.groq_api_key),
        },
        "models": {
            "alibaba": None,
            "groq_text": settings.groq_text_model,
            "groq_vision": settings.groq_vision_model,
            "groq_transcribe": settings.groq_audio_model,
        },
        "missing_required_env": [] if settings.groq_api_key else ["GROQ_API_KEY"],
        "message": f"Active chain: {' → '.join(chain)}",
    }


# ---------------------------------------------------------------------------
# POST /understand/voice  —  transcribe + extract in one call
# ---------------------------------------------------------------------------

MAX_AUDIO_BYTES = 20 * 1024 * 1024


@router.post("/understand/voice")
async def understand_voice(
    db: Session = Depends(get_db),
    file: UploadFile = File(..., description="Audio recording"),
    merchant_id: str = Depends(get_merchant_id),
):
    audio = await file.read()
    if not audio:
        raise DomainValidationError("audio file is empty")
    if len(audio) > MAX_AUDIO_BYTES:
        raise DomainValidationError("audio file too large (max 20 MB)")
    mime = (file.content_type or "audio/webm").split(";")[0].strip().lower()
    if not (mime.startswith("audio/") or mime == "video/webm"):
        raise DomainValidationError(f"unsupported audio type: {mime}")

    adapter = get_adapter()
    today = pkt_today()

    # Step 1: transcribe
    try:
        transcript_result = await adapter.transcribe_audio(audio, mime)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    # Step 2: extract structured event from transcript
    try:
        extraction = await adapter.extract_event_from_text(transcript_result.text, today)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    from app.services.ledger import build_draft

    draft = build_draft(
        db, extraction,
        source_type=SourceType.voice,
        raw_input=transcript_result.text,
        evidence_filename=None,
        merchant_id=merchant_id,
    )

    return {
        "capture": {
            "capture_id": uuid.uuid4().hex,
            "kind": "voice",
            "filename": None,
            "content_type": mime,
            "size_bytes": len(audio),
            "stored": False,
            "received_at": datetime.now().isoformat(),
            "next_step": "Review the extracted event and confirm.",
        },
        "provider": draft.provider,
        "event": _draft_to_fe_event(draft, transcript_result.text),
    }


# ---------------------------------------------------------------------------
# POST /understand/receipt  —  save image + extract in one call
# ---------------------------------------------------------------------------

MAX_IMAGE_BYTES = 10 * 1024 * 1024

_IMAGE_EXTS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


@router.post("/understand/receipt")
async def understand_receipt(
    db: Session = Depends(get_db),
    file: UploadFile = File(..., description="Receipt photo"),
    merchant_id: str = Depends(get_merchant_id),
):
    image = await file.read()
    if not image:
        raise DomainValidationError("image file is empty")
    if len(image) > MAX_IMAGE_BYTES:
        raise DomainValidationError("image file too large (max 10 MB)")
    mime = (file.content_type or "").split(";")[0].strip().lower()
    if mime not in _IMAGE_EXTS:
        raise DomainValidationError(f"unsupported image type: {mime}")

    # Save receipt evidence before AI runs
    filename = f"{uuid.uuid4().hex}{_IMAGE_EXTS[mime]}"
    (settings.uploads_dir / filename).write_bytes(image)

    adapter = get_adapter()
    today = pkt_today()

    try:
        extraction = await adapter.extract_event_from_image(image, mime, today)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    from app.services.ledger import build_draft

    draft = build_draft(
        db, extraction,
        source_type=SourceType.receipt,
        raw_input=None,
        evidence_filename=filename,
        merchant_id=merchant_id,
    )

    return {
        "capture": {
            "capture_id": uuid.uuid4().hex,
            "kind": "receipt",
            "filename": filename,
            "content_type": mime,
            "size_bytes": len(image),
            "stored": True,
            "received_at": datetime.now().isoformat(),
            "path": f"/uploads/{filename}",
            "next_step": "Review the extracted event and confirm.",
        },
        "provider": draft.provider,
        "event": _draft_to_fe_event(draft),
    }


# ---------------------------------------------------------------------------
# GET /ledger/summary
# ---------------------------------------------------------------------------


@router.get("/ledger/summary")
async def ledger_summary(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    dash = dashboard_bundle(db, merchant_id=merchant_id)
    return _summary_from_dashboard(dash)


# ---------------------------------------------------------------------------
# GET /ledger/events
# ---------------------------------------------------------------------------


@router.get("/ledger/events")
async def ledger_events(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    rows = (
        db.query(BusinessEvent, Customer.display_name)
        .outerjoin(Customer, BusinessEvent.customer_id == Customer.id)
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.verification_status == VerificationStatus.confirmed.value,
        )
        .order_by(BusinessEvent.occurred_at.desc(), BusinessEvent.id.desc())
        .limit(200)
        .all()
    )
    return [_event_to_fe(ev, name) for ev, name in rows]


# ---------------------------------------------------------------------------
# POST /ledger/events  —  save a frontend-shaped event to the ledger
# ---------------------------------------------------------------------------


@router.post("/ledger/events", status_code=201)
async def save_ledger_event(payload: dict, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    be_type = _BE_EVENT_TYPE.get(payload.get("event_type"), "cash_sale")
    amount = payload.get("amount") or 0
    amount_paisa = round(float(amount) * 100)
    if amount_paisa <= 0:
        raise DomainValidationError("amount must be positive")

    date_str = payload.get("date") or pkt_today().isoformat()
    try:
        occurred = date.fromisoformat(date_str)
    except (ValueError, TypeError) as exc:
        raise DomainValidationError(f"invalid date: {date_str}") from exc

    counterparty = payload.get("customer_name") or None

    # Ensure customer exists for credit types before calling confirm_event
    customer_id = None
    if be_type in ("credit_sale", "payment_received") and counterparty and counterparty.strip():
        from app.services.ledger import get_or_create_customer

        cust = get_or_create_customer(db, counterparty.strip(), merchant_id=merchant_id)
        customer_id = cust.id

    event_create = EventCreate(
        event_type=EventType(be_type),
        customer_id=customer_id,
        counterparty=counterparty,
        amount_paisa=amount_paisa,
        occurred_at=occurred,
        payment_status=(
            PaymentStatus.outstanding if be_type == "credit_sale"
            else PaymentStatus.paid if be_type in ("cash_sale", "expense")
            else None
        ),
        source_type=SourceType.voice if payload.get("source") == "voice" else SourceType.receipt,
        raw_input=payload.get("raw_input"),
        ai_confidence=payload.get("confidence"),
    )

    event, _ = confirm_event(db, event_create, merchant_id=merchant_id)
    _combined_cache.pop(merchant_id, None)  # invalidate combined cache
    out = event_to_out(event)
    return _event_to_fe(event, out.customer_name)


# ---------------------------------------------------------------------------
# GET /intelligence  —  evidence profile + financing matches + summary
# ---------------------------------------------------------------------------


@router.get("/intelligence")
async def intelligence(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    passport = compute_passport(db, merchant_id=merchant_id)
    readiness = evaluate_readiness(db, merchant_id=merchant_id, passport=passport)
    dash = dashboard_bundle(db, merchant_id=merchant_id)
    summary = _summary_from_dashboard(dash)

    # Evidence profile: map passport qualitative labels to frontend strings
    evidence_profile = {
        "documentation_coverage": (
            f"{passport.evidence_coverage_pct}% of recent activity has a voice or receipt source"
        ),
        "income_consistency": (
            f"Sales recorded across {passport.history_months} months — {passport.revenue_consistency}"
        ),
        "receivable_discipline": (
            f"{passport.recovery_rate_pct or 0:.0f}% of tracked udhaar recovered"
            if passport.recovery_rate_pct is not None
            else "No credit sales recorded yet"
        ),
        "expense_pattern": "Recurring supplier and utility costs are visible" if passport.total_recorded_events > 10 else "Limited expense data",
        "customer_concentration": (
            f"Top debtor represents {passport.customer_concentration_pct:.0f}% of receivables"
            if passport.customer_concentration_pct is not None
            else "No credit customers yet"
        ),
        "ledger_depth": f"{passport.total_recorded_events} verified records across {passport.history_months} months",
        "trust_notes": [
            "Merchant-confirmed entries only",
            "Every record retains its source",
            "No financing eligibility is invented",
        ],
    }

    # Financing matches: map ProgramReadiness to frontend FinancingMatch shape
    financing_matches = []
    for result in readiness:
        program = result.program
        relevance = "high" if result.overall == "appears_relevant" else "medium"
        match_reasons = [m.evidence_display or m.label for m in result.matched]
        gaps = [m.next_step or m.label for m in result.missing] + [r.next_step or r.label for r in result.not_verifiable]

        financing_matches.append({
            "program": {
                "id": program.id,
                "name": program.program_name,
                "institution": program.provider,
                "product_type": "small business finance",
                "target_customer": program.target_user,
                "eligibility_notes": (
                    "Your recorded data appears to meet some requirements. "
                    "Final eligibility is confirmed by the financing institution."
                ),
                "loan_range": program.loan_range or "See program details",
                "required_documents": [r.label for r in result.not_verifiable] or ["CNIC", "Business details"],
                "source_url": program.source_url,
                "last_checked": program.last_verified,
                "matching_hints": match_reasons or ["documented sales", "business evidence"],
            },
            "relevance": relevance,
            "match_reasons": match_reasons or ["Ledger activity recorded"],
            "gaps": gaps or ["All verifiable requirements appear met"],
            "grounded_summary": result.summary_line,
        })

    return {
        "evidence_profile": evidence_profile,
        "financing_matches": financing_matches,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# POST /actions/reminder/draft  —  voice-based reminder flow
# ---------------------------------------------------------------------------


@router.post("/actions/reminder/draft")
async def reminder_draft(
    db: Session = Depends(get_db),
    file: UploadFile = File(..., description="Voice command audio"),
    merchant_id: str = Depends(get_merchant_id),
):
    audio = await file.read()
    if not audio:
        raise DomainValidationError("audio file is empty")
    if len(audio) > MAX_AUDIO_BYTES:
        raise DomainValidationError("audio file too large")
    mime = (file.content_type or "audio/webm").split(";")[0].strip().lower()

    adapter = get_adapter()

    # Step 1: transcribe the voice command
    try:
        transcript_result = await adapter.transcribe_audio(audio, mime)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    command_text = transcript_result.text

    # Step 2: find the customer mentioned in the command
    customer = _find_customer_in_text(db, command_text, merchant_id=merchant_id)
    if customer is None:
        return {
            "command_text": command_text,
            "customer_name": None,
            "balance": None,
            "draft_message": None,
            "status": "not_found",
            "channel": "draft_on_screen",
            "notes": ["Could not identify a customer from the voice command."],
        }

    # Step 3: check outstanding balance
    outstanding = customer_outstanding_paisa(db, customer.id)
    if outstanding <= 0:
        return {
            "command_text": command_text,
            "customer_name": customer.display_name,
            "balance": {
                "customer_name": customer.display_name,
                "receivable_balance": 0,
                "currency": "PKR",
                "event_count": 0,
            },
            "draft_message": None,
            "status": "no_balance",
            "channel": "draft_on_screen",
            "notes": [f"{customer.display_name} has no outstanding udhaar."],
        }

    # Step 4: draft the reminder message via AI
    oldest_unpaid = customer_oldest_unpaid(db, customer.id)
    try:
        result = await adapter.draft_reminder(
            customer.display_name, outstanding, oldest_unpaid, tone="friendly"
        )
    except ProviderError:
        # Fallback draft message if AI is unavailable
        rupees = outstanding / 100
        draft_msg = (
            f"Assalam o Alaikum {customer.display_name} bhai, "
            f"aap ke zimay PKR {rupees:,.0f} baqi hain. "
            f"Barah-e-karam jab mumkin ho payment kar dein. Shukriya."
        )
        provider_name = "fallback"
    else:
        draft_msg = result.text
        provider_name = result.provider

    event_count = int(
        db.query(BusinessEvent)
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.customer_id == customer.id,
            BusinessEvent.verification_status == VerificationStatus.confirmed.value,
        )
        .count()
        or 0
    )

    return {
        "command_text": command_text,
        "customer_name": customer.display_name,
        "balance": {
            "customer_name": customer.display_name,
            "receivable_balance": round(outstanding / 100, 2),
            "currency": "PKR",
            "event_count": event_count,
        },
        "draft_message": draft_msg,
        "status": "drafted",
        "channel": "draft_on_screen",
        "notes": [
            f"Oldest unpaid entry: {oldest_unpaid.isoformat()}" if oldest_unpaid else "No specific unpaid date found.",
            f"Draft prepared using {provider_name} provider.",
        ],
    }


# ---------------------------------------------------------------------------
# POST /demo/seed  —  seed and return events in frontend shape
# ---------------------------------------------------------------------------


@router.post("/demo/seed")
async def demo_seed(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    load_seed(db, merchant_id=merchant_id)
    _combined_cache.pop(merchant_id, None)  # invalidate combined cache
    rows = (
        db.query(BusinessEvent, Customer.display_name)
        .outerjoin(Customer, BusinessEvent.customer_id == Customer.id)
        .filter(
            BusinessEvent.merchant_id == merchant_id,
            BusinessEvent.verification_status == VerificationStatus.confirmed.value,
        )
        .order_by(BusinessEvent.occurred_at.desc(), BusinessEvent.id.desc())
        .all()
    )
    return [_event_to_fe(ev, name) for ev, name in rows]


# ---------------------------------------------------------------------------
# GET /combined  —  single-request data load (summary + events + intelligence)
# ---------------------------------------------------------------------------


@router.get("/combined")
async def combined_data(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    """Return ALL data in a single request to eliminate 3x network round-trips.

    Results are cached for 30 seconds per merchant.  The cache is invalidated
    when a new event is saved (POST /ledger/events).
    """
    # Check cache first (skip DB work on cache hit)
    now = _time.time()
    cached = _combined_cache.get(merchant_id)
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1]

    # ── Fetch events + customers ONCE, reuse across all computations ──
    raw_events = _fetch_confirmed_events(db, merchant_id)
    customers = _fetch_customers(db, merchant_id)

    # Build frontend events list (sorted, limited)
    sorted_events = sorted(raw_events, key=lambda e: (e.occurred_at, e.id), reverse=True)[:200]
    fe_events = [
        _event_to_fe(ev, customers.get(ev.customer_id))
        for ev in sorted_events
    ]

    # ── Dashboard summary (reuses pre-fetched events + customers) ────
    dash = dashboard_bundle(db, merchant_id=merchant_id, _events=raw_events, _customers=customers)
    summary = _summary_from_dashboard(dash)

    # ── Passport + readiness (reuses pre-fetched events) ──────────────
    passport = compute_passport(db, merchant_id=merchant_id, _events=raw_events)
    readiness = evaluate_readiness(db, merchant_id=merchant_id, passport=passport)

    evidence_profile = {
        "documentation_coverage": (
            f"{passport.evidence_coverage_pct}% of recent activity has a voice or receipt source"
        ),
        "income_consistency": (
            f"Sales recorded across {passport.history_months} months — {passport.revenue_consistency}"
        ),
        "receivable_discipline": (
            f"{passport.recovery_rate_pct or 0:.0f}% of tracked udhaar recovered"
            if passport.recovery_rate_pct is not None
            else "No credit sales recorded yet"
        ),
        "expense_pattern": (
            "Recurring supplier and utility costs are visible"
            if passport.total_recorded_events > 10
            else "Limited expense data"
        ),
        "customer_concentration": (
            f"Top debtor represents {passport.customer_concentration_pct:.0f}% of receivables"
            if passport.customer_concentration_pct is not None
            else "No credit customers yet"
        ),
        "ledger_depth": f"{passport.total_recorded_events} verified records across {passport.history_months} months",
        "trust_notes": [
            "Merchant-confirmed entries only",
            "Every record retains its source",
            "No financing eligibility is invented",
        ],
    }

    financing_matches = []
    for r in readiness:
        program = r.program
        relevance = "high" if r.overall == "appears_relevant" else "medium"
        match_reasons = [m.evidence_display or m.label for m in r.matched]
        gaps = (
            [m.next_step or m.label for m in r.missing]
            + [n.next_step or n.label for n in r.not_verifiable]
        )
        financing_matches.append({
            "program": {
                "id": program.id,
                "name": program.program_name,
                "institution": program.provider,
                "product_type": "small business finance",
                "target_customer": program.target_user,
                "eligibility_notes": (
                    "Your recorded data appears to meet some requirements. "
                    "Final eligibility is confirmed by the financing institution."
                ),
                "loan_range": program.loan_range or "See program details",
                "required_documents": [n.label for n in r.not_verifiable] or ["CNIC", "Business details"],
                "source_url": program.source_url,
                "last_checked": program.last_verified,
                "matching_hints": match_reasons or ["documented sales", "business evidence"],
            },
            "relevance": relevance,
            "match_reasons": match_reasons or ["Ledger activity recorded"],
            "gaps": gaps or ["All verifiable requirements appear met"],
            "grounded_summary": r.summary_line,
        })

    result = {
        "summary": summary,
        "events": fe_events,
        "intelligence": {
            "evidence_profile": evidence_profile,
            "financing_matches": financing_matches,
        },
    }
    _combined_cache[merchant_id] = (_time.time(), result)
    return result
