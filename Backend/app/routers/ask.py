"""Ask Karobaar: the LLM picks a tool, SQL computes the numbers, the LLM only phrases."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai import get_adapter
from app.ai.base import ProviderError
from app.auth import get_merchant_id
from app.db import get_db, pkt_today
from app.errors import AIUnavailableError
from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_engine import SUGGESTIONS, SUPPORTED_TOOLS, run_tool

router = APIRouter(prefix="/ask", tags=["ask"])


@router.get("/suggestions")
async def suggestions():
    """Starter questions the frontend can show when the input is empty."""
    return {"suggestions": SUGGESTIONS, "supported_tools": list(SUPPORTED_TOOLS)}


@router.post("", response_model=AskResponse)
async def ask(payload: AskRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_merchant_id)):
    adapter = get_adapter()
    today = pkt_today()

    # Step 1: classify the question into a supported tool (LLM, structured JSON).
    try:
        tool_call = await adapter.interpret_question(payload.question, today)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    # Step 2: compute the answer deterministically from the confirmed ledger.
    data = run_tool(db, tool_call.tool, tool_call.args, today, merchant_id=merchant_id)

    # Step 3: phrase the computed numbers in the merchant's language (LLM, numbers given).
    try:
        answer = await adapter.compose_answer(payload.question, tool_call.tool, data)
    except ProviderError as exc:
        raise AIUnavailableError(str(exc)) from exc

    return AskResponse(answer=answer.text, tool_used=tool_call.tool, provider=answer.provider, data=data)
