"""Financing program and readiness contracts.

Language discipline: outputs say "appears to meet" / "requirements pending" —
never "eligible", "approved", or "guaranteed".
"""
from __future__ import annotations

from pydantic import BaseModel


class ProgramSummary(BaseModel):
    id: str
    program_name: str
    provider: str
    target_user: str
    purpose: str
    loan_range: str | None = None
    source_url: str
    last_verified: str


class Requirement(BaseModel):
    id: str
    label: str
    type: str  # metric | manual
    next_step: str | None = None


class MatchedRequirement(Requirement):
    evidence_value: float | int | None = None
    evidence_display: str | None = None


class MissingRequirement(Requirement):
    evidence_value: float | int | None = None
    evidence_display: str | None = None
    next_step: str


class ProgramReadiness(BaseModel):
    program: ProgramSummary
    overall: str  # appears_relevant | requirements_pending
    summary_line: str
    matched: list[MatchedRequirement]
    missing: list[MissingRequirement]
    not_verifiable: list[Requirement]
    next_step: str
