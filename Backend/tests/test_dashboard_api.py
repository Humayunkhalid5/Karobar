"""Dashboard, customers, reminders, and health endpoints against the seed dataset."""
from __future__ import annotations

import json

from app.db import month_key, pkt_today


def test_dashboard_headline_numbers(seeded_client):
    body = seeded_client.get("/api/dashboard").json()
    assert body["today"] == pkt_today().isoformat()
    assert body["month"] == month_key(pkt_today())
    assert body["outstanding_total_paisa"] == 10_000_000  # Rs 100,000
    assert body["outstanding_total_display"] == "Rs 100,000"
    assert body["overdue_total_paisa"] == 2_000_000  # Ahmed's 30k sale (45d old), 20k still unpaid
    assert body["overdue_total_display"] == "Rs 20,000"
    assert body["top_debtor"]["name"] == "Ahmed"
    assert body["top_debtor"]["outstanding_paisa"] == 5_850_000
    assert body["top_debtor"]["outstanding_display"] == "Rs 58,500"
    assert len(body["recent_events"]) == 10
    assert body["monthly_trend"]  # at least one month bucket


def test_dashboard_month_trend_is_sorted(seeded_client):
    trend = seeded_client.get("/api/dashboard").json()["monthly_trend"]
    months = [point["month"] for point in trend]
    assert months == sorted(months)
    assert len(months) <= 6


def test_customers_list_ordered_by_outstanding(seeded_client):
    body = seeded_client.get("/api/customers").json()
    assert body["total"] == 5
    names = [c["name"] for c in body["customers"]]
    assert names[0] == "Ahmed"
    assert names[1] == "Kamran"
    assert names[2] == "Bilal"
    assert set(names[3:]) == {"Tariq", "Usman"}  # fully paid, alphabetical
    assert body["customers"][0]["outstanding_paisa"] == 5_850_000
    assert body["customers"][0]["outstanding_display"] == "Rs 58,500"


def test_customers_search(seeded_client):
    body = seeded_client.get("/api/customers", params={"q": "ahm"}).json()
    assert body["total"] == 1
    assert body["customers"][0]["name"] == "Ahmed"

    body = seeded_client.get("/api/customers", params={"q": "xyz"}).json()
    assert body["total"] == 0


def test_customer_detail_statement(seeded_client):
    customers = seeded_client.get("/api/customers", params={"q": "ahmed"}).json()["customers"]
    ahmed = customers[0]
    detail = seeded_client.get(f"/api/customers/{ahmed['id']}").json()
    assert detail["customer"]["name"] == "Ahmed"
    assert detail["customer"]["credit_total_paisa"] == 8_350_000  # Rs 83,500 in credit sales
    assert detail["customer"]["recovered_paisa"] == 2_500_000  # Rs 25,000 received
    assert detail["customer"]["outstanding_paisa"] == 5_850_000
    assert detail["customer"]["event_count"] == 6  # 4 credit sales + 2 payments
    assert len(detail["events"]) == 6
    assert all(e["customer_name"] == "Ahmed" for e in detail["events"])


def test_customer_detail_404(seeded_client):
    response = seeded_client.get("/api/customers/9999")
    assert response.status_code == 404
    assert response.json()["error"]["type"] == "not_found"


def test_reminder_draft_contains_only_ledger_facts(seeded_client):
    ahmed = seeded_client.get("/api/customers", params={"q": "ahmed"}).json()["customers"][0]
    body = seeded_client.post("/api/reminders/draft", json={"customer_id": ahmed["id"], "tone": "friendly"}).json()
    assert body["customer_name"] == "Ahmed"
    assert body["outstanding_display"] == "Rs 58,500"
    assert "Ahmed" in body["message"]
    assert "Rs 58,500" in body["message"]  # the amount comes from SQL, not the model
    assert body["provider"] == "demo"


def test_reminder_firm_tone(seeded_client):
    ahmed = seeded_client.get("/api/customers", params={"q": "ahmed"}).json()["customers"][0]
    body = seeded_client.post("/api/reminders/draft", json={"customer_id": ahmed["id"], "tone": "firm"}).json()
    assert len(body["message"]) > 20


def test_reminder_rejected_when_no_outstanding(seeded_client):
    customers = seeded_client.get("/api/customers").json()["customers"]
    usman = next(c for c in customers if c["name"] == "Usman")  # fully paid in the seed
    response = seeded_client.post("/api/reminders/draft", json={"customer_id": usman["id"]})
    assert response.status_code == 422
    assert response.json()["error"]["type"] == "validation_error"


def test_reminder_unknown_customer(seeded_client):
    assert seeded_client.post("/api/reminders/draft", json={"customer_id": 9999}).status_code == 404


def test_health(seeded_client):
    body = seeded_client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["provider_chain"] == ["demo"]
    assert body["today"] == pkt_today().isoformat()

    verified = seeded_client.get("/api/health", params={"verify": "true"}).json()
    assert verified["providers"] == [{"name": "demo", "status": "ok"}]


def test_root(client):
    body = client.get("/").json()
    assert body["api_prefix"] == "/api"
    assert body["docs"] == "/docs"


def test_openapi_contract_is_generated(client):
    schema = client.get("/openapi.json").json()
    paths = schema["paths"]
    for expected in (
        "/api/health",
        "/api/capture/transcribe",
        "/api/capture/extract",
        "/api/capture/extract-receipt",
        "/api/events",
        "/api/customers",
        "/api/dashboard",
        "/api/ask",
        "/api/evidence/passport",
        "/api/financing/programs",
        "/api/financing/readiness",
        "/api/reminders/draft",
        "/api/demo/seed",
        "/api/demo/reset",
    ):
        assert expected in paths, f"missing endpoint {expected}"
    # every event amount crossing the API is integer paisa
    event_schema = schema["components"]["schemas"]["EventOut"]
    assert json.dumps(event_schema)
