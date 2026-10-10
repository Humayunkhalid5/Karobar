"""Health and readiness: app status plus optional live provider-chain verification."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.ai import get_adapter
from app.config import settings
from app.db import pkt_today

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(verify: bool = Query(False, description="Ping every provider in the chain (slow, costs a call)")):
    """Cheap liveness check by default; `?verify=true` pings each configured provider."""
    payload: dict[str, object] = {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "today": pkt_today().isoformat(),
        "provider_chain": get_adapter().chain_names(),
        "providers": None,
    }
    if verify:
        providers: list[dict[str, str]] = []
        for provider in get_adapter().providers:
            try:
                await provider.ping()
                providers.append({"name": provider.name, "status": "ok"})
            except Exception as exc:  # noqa: BLE001 - a health check must never raise
                providers.append({"name": provider.name, "status": "error", "detail": str(exc)})
        payload["providers"] = providers
    return payload
