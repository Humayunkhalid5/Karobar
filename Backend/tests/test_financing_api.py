"""Financing readiness and the Financial Evidence Passport.

Language discipline is asserted literally: no response may claim "eligible",
"approved", or "guaranteed" — only "appears to meet" / "requirements pending".
"""
from __future__ import annotations

import json

SEED_EVENTS = 63
SEED_CREDIT_TOTAL_PAISA = 19_800_000  # Rs 198,000
SEED_RECOVERED_PAISA = 9_800_000  # Rs 98,000
SEED_OUTSTANDING_PAISA = 10_000_000  # Rs 100,000


def _by_id(readiness: list[dict], program_id: str) -> dict:
    return next(r for r in readiness if r["program"]["id"] == program_id)


def test_programs_list(seeded_client):
    body = seeded_client.get("/api/financing/programs").json()
    assert len(body) == 5
    ids = {program["id"] for program in body}
    assert "akhuwat-family-enterprise-loan" in ids
    assert "pm-youth-business-agri-loan" in ids
    assert "hbl-small-business-finance" in ids
    for program in body:
        assert program["program_name"]
        assert program["source_url"].startswith("http")


def test_passport_headline_numbers(seeded_client):
    body = seeded_client.get("/api/evidence/passport").json()
    assert body["total_recorded_events"] == SEED_EVENTS
    assert body["credit_sales_total_paisa"] == SEED_CREDIT_TOTAL_PAISA
    assert body["total_recovered_paisa"] == SEED_RECOVERED_PAISA
    assert body["outstanding_receivables_paisa"] == SEED_OUTSTANDING_PAISA
    assert body["history_months"] >= 4  # seed spans ~3.5 months -> 4-5 buckets
    # 98,000 / 198,000 = 49.49% -> 49.5 after rounding
    assert abs(body["recovery_rate_pct"] - 49.5) < 0.05
    assert body["recovery_pattern"] == "moderate"
    assert body["revenue_consistency"] in ("consistent", "variable", "irregular")
    assert len(body["monthly_sales"]) == body["history_months"]
    assert body["metrics"]["history_months"] == body["history_months"]


def test_passport_empty_ledger_is_zero_not_error(client):
    body = client.get("/api/evidence/passport").json()
    assert body["history_months"] == 0
    assert body["total_recorded_events"] == 0
    assert body["recovery_pattern"] == "no credit sales recorded yet"
    assert body["recovery_rate_pct"] is None
    assert body["metrics"]["avg_monthly_sales_paisa"] == 0


def test_readiness_partitions_every_requirement(seeded_client):
    readiness = seeded_client.get("/api/financing/readiness").json()
    assert len(readiness) == 5
    for entry in readiness:
        program_requirement_count = len(entry["matched"]) + len(entry["missing"]) + len(entry["not_verifiable"])
        assert program_requirement_count >= 2
        assert entry["overall"] in ("appears_relevant", "requirements_pending")
        assert entry["summary_line"]
        assert entry["next_step"]
        # metric requirements carry evidence; manual ones carry a next step
        for req in entry["missing"]:
            assert req["next_step"]
            assert req["evidence_display"]


def test_readiness_akhuwat_appears_relevant(seeded_client):
    readiness = seeded_client.get("/api/financing/readiness").json()
    akhuwat = _by_id(readiness, "akhuwat-family-enterprise-loan")
    assert akhuwat["overall"] == "appears_relevant"
    assert akhuwat["missing"] == []
    matched_ids = {req["id"] for req in akhuwat["matched"]}
    assert {"history", "sales"} <= matched_ids
    # manual requirements are honestly reported as not verifiable by the ledger
    not_verifiable_ids = {req["id"] for req in akhuwat["not_verifiable"]}
    assert "cnic" in not_verifiable_ids


def test_readiness_bop_and_hbl_pending(seeded_client):
    readiness = seeded_client.get("/api/financing/readiness").json()
    bop = _by_id(readiness, "bop-e-business-qarza")
    assert bop["overall"] == "requirements_pending"
    missing_ids = {req["id"] for req in bop["missing"]}
    assert "history" in missing_ids  # 12 months needed, seed has ~4-5

    hbl = _by_id(readiness, "hbl-small-business-finance")
    assert hbl["overall"] == "requirements_pending"
    missing_ids = {req["id"] for req in hbl["missing"]}
    assert "history" in missing_ids  # 36 months needed, seed has ~4-5
    assert "sales" in missing_ids  # avg monthly sales far below PKR 500,000


def test_readiness_pm_youth_pending_on_history(seeded_client):
    readiness = seeded_client.get("/api/financing/readiness").json()
    pm_youth = _by_id(readiness, "pm-youth-business-agri-loan")
    assert pm_youth["overall"] == "requirements_pending"
    missing_ids = {req["id"] for req in pm_youth["missing"]}
    assert "history" in missing_ids  # 6 months needed, seed has ~4-5


def test_language_discipline_never_promises_approval(seeded_client):
    readiness = seeded_client.get("/api/financing/readiness").json()
    passport = seeded_client.get("/api/evidence/passport").json()
    combined = json.dumps(readiness).lower() + json.dumps(passport).lower()
    for banned in ("eligible", "approved", "guaranteed", "credit score"):
        assert banned not in combined, f"forbidden phrase '{banned}' found in response"
    assert "appears" in json.dumps(readiness).lower()  # hedged language is present
