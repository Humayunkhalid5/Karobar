"""Ask Karobaar contracts."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class AskResponse(BaseModel):
    answer: str
    tool_used: str
    provider: str
    data: dict[str, Any] = Field(default_factory=dict)
