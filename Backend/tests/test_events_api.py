"""Events API: create, list with filters, patch, delete, and error mapping."""
from __future__ import annotations

from datetime import timedelta

from app.db import pkt_today

TODAY = pkt_today().isoformat()
YESTERDAY = (pkt_today() - timedelta(days=1)).isoformat()


def _payload(**overrides):
    payload = {
        "event_type": "cash_sale",
        "amount_paisa": 150000,
        "occurred_at": TODAY,
    }
    payload.update(overrides)
    return payload


def test_create_manual_event(client):
    response = client.post("/api/events", json=_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["event_type"] == "cash_sale"
    assert body["amount_paisa"] == 150000
    assert body["amount_display"] == "Rs 1,500"
    assert body["verification_status"] == "confirmed"
    assert body["source_type"] == "manual"
    assert body["customer_id"] is None
    assert body["payment_status"] == "paid"


def test_create_with_counterparty_creates_customer(client):
    response = client.post(
        "/api/events",
        json=_payload(event_type="credit_sale", counterparty="Zain", payment_status="outstanding"),
    )
    assert response.status_code == 201
    assert response.json()["customer_name"] == "Zain"

    customers = client.get("/api/customers").json()
    assert customers["total"] == 1
    assert customers["customers"][0]["name"] == "Zain"


def test_create_credit_sale_without_customer_rejected(client):
    response = client.post("/api/events", json=_payload(event_type="credit_sale"))
    assert response.status_code == 422
    assert response.json()["error"]["type"] == "validation_error"


def test_create_future_event_rejected(client):
    response = client.post("/api/events", json=_payload(occurred_at=(pkt_today() + timedelta(days=1)).isoformat()))
    assert response.status_code == 422


def test_create_with_unknown_customer_id_rejected(client):
    response = client.post("/api/events", json=_payload(event_type="credit_sale", customer_id=999))
    assert response.status_code == 404
    assert response.json()["error"]["type"] == "not_found"


def test_list_with_type_filter(client):
    client.post("/api/events", json=_payload())
    client.post("/api/events", json=_payload(event_type="expense", occurred_at=YESTERDAY))

    body = client.get("/api/events", params={"event_type": "expense"}).json()
    assert body["total"] == 1
    assert body["events"][0]["event_type"] == "expense"

    body = client.get("/api/events").json()
    assert body["total"] == 2
    assert body["events"][0]["occurred_at"] >= body["events"][1]["occurred_at"]  # newest first


def test_list_with_date_range_filter(client):
    client.post("/api/events", json=_payload(occurred_at=YESTERDAY))
    client.post("/api/events", json=_payload(occurred_at=TODAY))

    body = client.get("/api/events", params={"from": TODAY, "to": TODAY}).json()
    assert body["total"] == 1
    assert body["events"][0]["occurred_at"] == TODAY

    body = client.get("/api/events", params={"from": YESTERDAY, "to": YESTERDAY}).json()
    assert body["total"] == 1
    assert body["events"][0]["occurred_at"] == YESTERDAY


def test_get_event_and_404_envelope(client):
    created = client.post("/api/events", json=_payload()).json()

    assert client.get(f"/api/events/{created['id']}").json()["id"] == created["id"]

    missing = client.get("/api/events/99999")
    assert missing.status_code == 404
    assert missing.json()["error"]["type"] == "not_found"
    assert "99999" in missing.json()["error"]["message"]


def test_patch_updates_amount(client):
    created = client.post("/api/events", json=_payload()).json()
    response = client.patch(f"/api/events/{created['id']}", json={"amount_paisa": 200000, "notes": "corrected"})
    assert response.status_code == 200
    body = response.json()
    assert body["amount_paisa"] == 200000
    assert body["amount_display"] == "Rs 2,000"
    assert body["notes"] == "corrected"


def test_patch_missing_event_404(client):
    assert client.patch("/api/events/99999", json={"amount_paisa": 100}).status_code == 404


def test_delete_event(client):
    created = client.post("/api/events", json=_payload()).json()
    assert client.delete(f"/api/events/{created['id']}").status_code == 204
    assert client.get(f"/api/events/{created['id']}").status_code == 404


def test_demo_seed_and_reset_roundtrip(seeded_client):
    seeded = seeded_client.get("/api/events").json()
    assert seeded["total"] == 63

    assert seeded_client.post("/api/demo/reset").status_code == 200
    assert seeded_client.get("/api/events").json()["total"] == 0
    assert seeded_client.get("/api/customers").json()["total"] == 0

    assert seeded_client.post("/api/demo/seed").status_code == 200
    assert seeded_client.get("/api/events").json()["total"] == 63
