"""A field worker can delete a citizen they registered."""
import uuid

from fastapi.testclient import TestClient

from app.main import app


def _login(client: TestClient, username: str) -> str:
    res = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": "password123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_field_worker_can_delete_a_registered_citizen():
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {_login(client, 'field_worker')}"}
    unique = uuid.uuid4().hex[:8]
    created = client.post(
        "/api/v1/citizens/",
        json={
            "name": f"Delete Probe {unique}",
            "age": 66,
            "gender": "Female",
            "monthly_income": 1200,
            "is_bpl": True,
            "state": "Rajasthan",
            "district": "Jaipur",
            "mobile_number": f"8{uuid.uuid4().int % 10**9:09d}",
        },
        headers=headers,
    )
    assert created.status_code == 200, created.text
    citizen_id = created.json()["id"]

    removed = client.delete(f"/api/v1/citizens/{citizen_id}", headers=headers)
    assert removed.status_code == 200, removed.text
    assert removed.json()["status"] == "DELETED"

    missing = client.get(f"/api/v1/citizens/{citizen_id}", headers=headers)
    assert missing.status_code == 404
