"""Dashboard: one call powers the whole home screen, every number SQL-computed."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.db import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.metrics import dashboard_bundle

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    return dashboard_bundle(db, merchant_id=merchant_id)
