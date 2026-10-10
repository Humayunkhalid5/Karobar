"""Karobaar AI backend entrypoint: FastAPI app, lifespan, CORS, and error mapping."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.ai.base import ProviderError
from app.auth import DEMO_MERCHANT
from app.config import settings
from app.data.seed import load_seed
from app.db import SessionLocal, engine, init_db
from app.errors import AIUnavailableError, DomainValidationError, KarobaarError, NotFoundError
from app.models import BusinessEvent
from app.routers import ALL_ROUTERS
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def _warmup_db_pool():
    """Background task: establish one warm connection in the pool at startup.

    Supabase Postgres in ap-northeast-1 (Tokyo) costs ~4s for the first SSL +
    PgBouncer handshake.  Warming the pool at startup means the first user
    request doesn't pay that penalty.
    """
    def _do_warmup():
        try:
            conn = engine.connect()
            conn.exec_driver_sql("SELECT 1")
            conn.close()
            logger.info("DB pool warmed (1 connection ready)")
        except Exception as exc:
            logger.warning("DB pool warmup skipped: %s", exc)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_warmup)


async def _warmup_gemini():
    """Background task: hit Gemini API once at startup to avoid cold-start on first receipt."""
    try:
        from app.ai.adapter import get_adapter
        adapter = get_adapter()
        # A lightweight text call warms the Gemini connection
        result = await adapter.extract_event_from_text("test warmup", __import__("datetime").date.today())
        logger.info("Gemini warmup OK (provider=%s)", result.provider if hasattr(result, "provider") else "?")
    except Exception as exc:
        logger.warning("Gemini warmup skipped: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.auto_seed:
        db = SessionLocal()
        try:
            if (
                db.query(BusinessEvent)
                .filter(BusinessEvent.merchant_id == DEMO_MERCHANT)
                .count() == 0
            ):
                load_seed(db, merchant_id=DEMO_MERCHANT)
        finally:
            db.close()
    # Warm up DB pool and Gemini in the background so first requests are fast
    warmup_gemini = asyncio.create_task(_warmup_gemini())
    warmup_db = asyncio.create_task(_warmup_db_pool())
    yield
    warmup_gemini.cancel()
    warmup_db.cancel()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Voice-first financial evidence and decision support for informal Pakistani "
        "merchants. AI captures and explains; deterministic SQL computes every number."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in ALL_ROUTERS:
    app.include_router(router, prefix="/api")

# Uploaded receipt evidence is served back to the review screen from here.
app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir)), name="uploads")


def _error(status_code: int, error_type: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"type": error_type, "message": message}})


@app.exception_handler(NotFoundError)
async def _not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _error(404, "not_found", str(exc))


@app.exception_handler(DomainValidationError)
async def _validation_handler(request: Request, exc: DomainValidationError) -> JSONResponse:
    return _error(422, "validation_error", str(exc))


@app.exception_handler(AIUnavailableError)
async def _ai_unavailable_handler(request: Request, exc: AIUnavailableError) -> JSONResponse:
    return _error(503, "ai_unavailable", str(exc))


@app.exception_handler(ProviderError)
async def _provider_error_handler(request: Request, exc: ProviderError) -> JSONResponse:
    return _error(503, "ai_unavailable", str(exc))


@app.exception_handler(KarobaarError)
async def _karobaar_handler(request: Request, exc: KarobaarError) -> JSONResponse:
    return _error(400, "domain_error", str(exc))


@app.get("/", tags=["health"])
async def root():
    return {
        "name": settings.app_name,
        "environment": settings.environment,
        "docs": "/docs",
        "api_prefix": "/api",
    }
