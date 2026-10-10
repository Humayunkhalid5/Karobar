"""Ask Karobaar: LLM picks the tool, SQL computes, LLM phrases.

The seed dataset is designed so every headline number is exact (see
app/data/seed.py): total outstanding Rs 100,000, Ahmed Rs 58,500, recovered
Rs 98,000 of Rs 198,000 credit (~49.5%).
"""
from __future__ import annotations

from app.db import month_key, pkt_today

TOTAL_OUTSTANDING_PAISA = 10_000_000  # Rs 100,000
AHMED_OUTSTANDING_PAISA = 5_850_000  # Rs 58,500


def test_suggestions_endpoint(client):
    body = client.get("/api/ask/suggestions").json()
    assert len(body["suggestions"]) >= 3
    assert "total_outstanding" in body["supported_tools"]


def test_total_outstanding_question(seeded_client):
    response = seeded_client.post("/api/ask", json={"question": "Total udhaar kitna hai?"})
    assert response.status_code == 200
    body = response.json()
    assert body["tool_used"] == "total_outstanding"
    assert body["data"]["total_outstanding_paisa"] == TOTAL_OUTSTANDING_PAISA
    assert body["data"]["total_outstanding_display"] == "Rs 100,000"
    assert "Rs 100,000" in body["answer"]
    assert body["provider"] == "demo"


def test_top_debtor_question(seeded_client):
    body = seeded_client.post("/api/ask", json={"question": "Sab se zyada udhaar kis ka hai?"}).json()
    assert body["tool_used"] == "top_debtor"
    assert body["data"]["name"] == "Ahmed"
    assert body["data"]["outstanding_paisa"] == AHMED_OUTSTANDING_PAISA
    assert body["data"]["oldest_unpaid"] is not None
    assert "Ahmed" in body["answer"]


def test_customer_outstanding_question(seeded_client):
    body = seeded_client.post("/api/ask", json={"question": "Ahmed ka udhaar kitna hai?"}).json()
    assert body["tool_used"] == "customer_outstanding"
    assert body["data"]["status"] == "ok"
    assert body["data"]["name"] == "Ahmed"
    assert body["data"]["outstanding_paisa"] == AHMED_OUTSTANDING_PAISA


def test_unknown_customer_question_lists_candidates(seeded_client):
    body = seeded_client.post("/api/ask", json={"question": "Bilal ka udhaar kitna hai?"}).json()
    assert body["tool_used"] == "customer_outstanding"
    assert body["data"]["status"] == "ok"
    assert body["data"]["outstanding_paisa"] == 950000  # Rs 9,500

    body = seeded_client.post("/api/ask", json={"question": "Zain ka udhaar kitna hai?"}).json()
    assert body["data"]["status"] == "not_found"
    assert "Ahmed" in body["data"]["candidates"]


def test_monthly_sales_question(seeded_client):
    body = seeded_client.post("/api/ask", json={"question": "Is month ki sales kitni hui?"}).json()
    assert body["tool_used"] == "monthly_sales"
    assert body["data"]["month"] == month_key(pkt_today())
    assert body["data"]["sales_paisa"] > 0
    # cash + credit always sum to the total — the split must be exhaustive
    assert (
        body["data"]["cash_sales_paisa"] + body["data"]["credit_sales_paisa"] == body["data"]["sales_paisa"]
    )
    assert body["data"]["sales_display"].startswith("Rs ")


def test_sales_comparison_question(seeded_client):
    body = seeded_client.post(
        "/api/ask", json={"question": "Is month aur pichle month ki sales ka comparison?"}
    ).json()
    assert body["tool_used"] == "sales_comparison"
    assert "current" in body["data"] and "previous" in body["data"]
    assert body["data"]["direction"] in ("up", "down", "same")


def test_unsupported_question_gets_explicit_unknown(seeded_client):
    body = seeded_client.post("/api/ask", json={"question": "Mujhe cricket pasand hai"}).json()
    assert body["tool_used"] == "unsupported"
    assert body["data"]["status"] == "unknown_tool"
    assert len(body["answer"]) > 0
    assert body["data"]["suggestions"]  # the model is offered concrete alternatives


def test_ask_never_invents_numbers_when_ledger_empty(client):
    body = client.post("/api/ask", json={"question": "Total udhaar kitna hai?"}).json()
    assert body["tool_used"] == "total_outstanding"
    assert body["data"]["total_outstanding_paisa"] == 0
    assert "Rs 0" in body["answer"]
