"""Approved IGNOAPS applications store a renewal due date."""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app


def _login(client: TestClient, username: str) -> str:
    res = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": "password123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_approved_ignoaps_renewal_is_about_one_year_out():
    client = TestClient(app)
    worker_headers = {"Authorization": f"Bearer {_login(client, 'field_worker')}"}
    unique = uuid.uuid4().hex
    created = client.post(
        "/api/v1/citizens/",
        json={
            "name": f"Renewal Probe {unique}",
            "age": 68,
            "gender": "Female",
            "monthly_income": 1500,
            "is_bpl": True,
            "state": "Rajasthan",
            "district": "Jaipur",
            "mobile_number": f"9{uuid.uuid4().int % 10**9:09d}",
        },
        headers=worker_headers,
    )
    assert created.status_code == 200, created.text
    citizen_id = created.json()["id"]

    filed = client.post(
        "/api/v1/applications/",
        json={"citizen_id": citizen_id, "scheme_id": "IGNOAPS"},
        headers=worker_headers,
    )
    assert filed.status_code == 200, filed.text
    assert filed.json()["renewal_due_at"] is None
    app_id = filed.json()["id"]

    admin_headers = {"Authorization": f"Bearer {_login(client, 'admin')}"}
    patched = client.patch(
        f"/api/v1/applications/{app_id}/status",
        params={"status": "APPROVED"},
        headers=admin_headers,
    )
    assert patched.status_code == 200, patched.text

    listed = client.get(
        "/api/v1/applications/",
        params={"citizen_id": citizen_id},
        headers=worker_headers,
    )
    assert listed.status_code == 200, listed.text
    rows = listed.json()
    assert len(rows) == 1
    assert rows[0]["status"] == "APPROVED"
    assert rows[0]["scheme_id"] == "IGNOAPS"
    due = datetime.fromisoformat(rows[0]["renewal_due_at"])
    if due.tzinfo is not None:
        due = due.astimezone(timezone.utc).replace(tzinfo=None)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    assert abs((due - now) - timedelta(days=365)) <= timedelta(days=2)
