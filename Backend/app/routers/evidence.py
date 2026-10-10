"""Financial Evidence Passport: explainable evidence for lenders, never a credit score."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.db import get_db
from app.schemas.evidence import PassportResponse
from app.services.passport import compute_passport

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.get("/passport", response_model=PassportResponse)
async def passport(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    return compute_passport(db, merchant_id=merchant_id)
