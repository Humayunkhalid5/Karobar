"""Financing readiness: match verified ledger metrics against published program requirements.

Hard rule: we never say "eligible" or "approved" — only "appears to meet" /
"requirements pending". Manual requirements (CNIC, age, registration) are shown
as not-verifiable-with-next-step rather than pretending the ledger can check them.
"""
from __future__ import annotations

import json
import operator
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.schemas.financing import (
    MatchedRequirement,
    MissingRequirement,
    ProgramReadiness,
    ProgramSummary,
    Requirement,
)
from app.services.money import format_pkr
from app.services.passport import compute_passport

PROGRAMS_PATH = Path(__file__).resolve().parent.parent / "data" / "financing_programs.json"

_OPS = {
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt,
    "==": operator.eq,
}

_SUMMARY_FIELDS = (
    "id",
    "program_name",
    "provider",
    "target_user",
    "purpose",
    "loan_range",
    "source_url",
    "last_verified",
)


def load_programs() -> list[dict[str, Any]]:
    with open(PROGRAMS_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def _display(metric: str, value: Any) -> str:
    if metric == "history_months":
        return f"{value} months"
    if metric in ("avg_monthly_sales_paisa", "total_sales_paisa", "outstanding_receivables_paisa"):
        return format_pkr(int(value))
    if metric in ("recovery_rate_pct", "evidence_coverage_pct"):
        return f"{value}%"
    return str(value)


def evaluate_readiness(
    db: Session,
    today: date | None = None,
    merchant_id: str = "demo",
    passport=None,
) -> list[ProgramReadiness]:
    if passport is None:
        passport = compute_passport(db, today, merchant_id=merchant_id)
    metrics = passport.metrics

    results: list[ProgramReadiness] = []
    for program in load_programs():
        matched: list[MatchedRequirement] = []
        missing: list[MissingRequirement] = []
        not_verifiable: list[Requirement] = []

        for req in program.get("requirements", []):
            base = {
                "id": req["id"],
                "label": req["label"],
                "type": req["type"],
            }
            if req["type"] == "metric":
                actual = metrics.get(req["metric"])
                if actual is None:
                    not_verifiable.append(Requirement(**base, next_step=req.get("next_step")))
                    continue
                op = _OPS.get(req.get("op", ">="), operator.ge)
                if op(actual, req["value"]):
                    matched.append(
                        MatchedRequirement(
                            **base,
                            next_step=req.get("next_step"),
                            evidence_value=actual,
                            evidence_display=_display(req["metric"], actual),
                        )
                    )
                else:
                    fallback_step = (
                        f"Your recorded value is {_display(req['metric'], actual)}; "
                        f"this program's published requirement is {req.get('display', req['value'])}."
                    )
                    missing.append(
                        MissingRequirement(
                            **base,
                            evidence_value=actual,
                            evidence_display=_display(req["metric"], actual),
                            next_step=req.get("next_step") or fallback_step,
                        )
                    )
            else:
                not_verifiable.append(Requirement(**base, next_step=req.get("next_step")))

        verifiable_count = len(matched) + len(missing)
        overall = "appears_relevant" if not missing else "requirements_pending"
        summary_line = (
            f"Your recorded data appears to meet {len(matched)} of {verifiable_count} "
            f"ledger-verifiable requirements. {len(not_verifiable)} requirement(s) need documents "
            f"Karobaar cannot verify — check them on the official source."
        )
        if missing:
            next_step = missing[0].next_step
        elif not_verifiable:
            next_step = not_verifiable[0].next_step or "Review the official source and prepare the listed documents."
        else:
            next_step = "Review the official source and apply."

        results.append(
            ProgramReadiness(
                program=ProgramSummary(**{k: program[k] for k in _SUMMARY_FIELDS}),
                overall=overall,
                summary_line=summary_line,
                matched=matched,
                missing=missing,
                not_verifiable=not_verifiable,
                next_step=next_step,
            )
        )
    return results
