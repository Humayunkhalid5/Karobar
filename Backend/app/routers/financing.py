"""Financing programs and readiness matching (ledger-verifiable vs manual requirements)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.db import get_db
from app.schemas.financing import ProgramReadiness, ProgramSummary
from app.services.matching import evaluate_readiness, load_programs

router = APIRouter(prefix="/financing", tags=["financing"])


@router.get("/programs", response_model=list[ProgramSummary])
async def programs() -> list[Any]:
    return [ProgramSummary.model_validate(program) for program in load_programs()]


@router.get("/readiness", response_model=list[ProgramReadiness])
async def readiness(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    return evaluate_readiness(db, merchant_id=merchant_id)
