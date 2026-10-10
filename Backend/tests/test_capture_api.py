"""Capture API: transcription, text extraction to reviewable drafts, receipt upload.

All tests run against the demo provider, which parses deterministically —
these tests pin the capture contract, not the LLM's creativity.
"""
from __future__ import annotations

from datetime import timedelta

from app.config import settings
from app.db import pkt_today

# Canonical 1x1 transparent PNG (67 bytes) — the demo provider ignores pixels,
# but the router must accept, size-check, and store a real image upload.
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a"
    "0000000d49484452"
    "00000001000000010806000000"
    "1f15c489"
    "0000000a49444154"
    "789c6300010000050001"
    "0d0a2db4"
    "0000000049454e44"
    "ae426082"
)


def test_transcribe_returns_demo_transcript(client):
    response = client.post(
        "/api/capture/transcribe",
        files={"file": ("audio.webm", b"fake-audio-bytes", "audio/webm")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "demo"
    assert "udhaar" in body["transcript"]


def test_transcribe_rejects_non_audio(client):
    response = client.post(
        "/api/capture/transcribe",
        files={"file": ("notes.txt", b"not audio", "text/plain")},
    )
    assert response.status_code == 422
    assert response.json()["error"]["type"] == "validation_error"


def test_extract_udhaar_text_to_draft(client):
    response = client.post(
        "/api/capture/extract",
        json={"text": "Ahmed ne paanch hazaar ka maal udhaar liya"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["event_type"] == "credit_sale"
    assert body["counterparty"] == "Ahmed"
    assert body["amount_paisa"] == 500000
    assert body["amount_display"] == "Rs 5,000"
    assert body["occurred_at"] == pkt_today().isoformat()
    assert body["payment_status"] == "outstanding"
    assert body["missing_fields"] == []
    assert body["possible_duplicate"] is False
    assert body["provider"] == "demo"
    assert body["source_type"] == "voice"


def test_extract_yesterday_cash_sale(client):
    response = client.post(
        "/api/capture/extract",
        json={"text": "Kal 2500 ki cash sale hui"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["event_type"] == "cash_sale"
    assert body["amount_paisa"] == 250000
    assert body["occurred_at"] == (pkt_today() - timedelta(days=1)).isoformat()
    assert body["payment_status"] == "paid"
    assert body["counterparty"] is None


def test_extract_gibberish_reports_missing_fields(client):
    response = client.post("/api/capture/extract", json={"text": "hello world"})
    assert response.status_code == 200
    body = response.json()
    assert "event_type" in body["missing_fields"]
    assert "amount" in body["missing_fields"]


def test_extract_flags_existing_event_as_duplicate(client):
    created = client.post(
        "/api/events",
        json={"event_type": "cash_sale", "amount_paisa": 250000, "occurred_at": pkt_today().isoformat()},
    ).json()

    body = client.post("/api/capture/extract", json={"text": "Aaj 2500 ki cash sale hui"}).json()
    assert body["possible_duplicate"] is True
    assert body["duplicate_of"] == created["id"]


def test_extract_receipt_saves_evidence_and_drafts(client):
    response = client.post(
        "/api/capture/extract-receipt",
        files={"file": ("receipt.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["event_type"] == "expense"
    assert body["amount_paisa"] is None
    assert body["missing_fields"] == ["amount"]
    assert body["source_type"] == "receipt"
    assert body["provider"] == "demo"
    assert body["evidence_filename"].endswith(".png")
    assert body["occurred_at"] == pkt_today().isoformat()

    saved = settings.uploads_dir / body["evidence_filename"]
    assert saved.exists()
    assert saved.read_bytes() == PNG_BYTES


def test_extract_receipt_rejects_non_image(client):
    response = client.post(
        "/api/capture/extract-receipt",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 422


def test_extract_manual_source_param(client):
    response = client.post("/api/capture/extract?source=manual", json={"text": "Bijli ka bill 3500 diya"})
    assert response.status_code == 200
    body = response.json()
    assert body["event_type"] == "expense"
    assert body["source_type"] == "manual"
    assert body["amount_paisa"] == 350000
