"""Demo data controls: load the deterministic seed dataset or wipe the ledger."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_merchant_id
from app.data.seed import load_seed
from app.db import get_db
from app.models import BusinessEvent, Customer

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/seed")
async def seed(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    counts = load_seed(db, merchant_id=merchant_id)
    return {"status": "seeded", **counts}


@router.post("/reset")
async def reset(db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    db.query(BusinessEvent).filter(BusinessEvent.merchant_id == merchant_id).delete()
    db.query(Customer).filter(Customer.merchant_id == merchant_id).delete()
    db.commit()
    return {"status": "reset", "customers": 0, "events": 0}
