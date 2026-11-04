"""Admins can deactivate or delete a portal user. The signed-in admin cannot remove themselves."""
import uuid

from fastapi.testclient import TestClient

from app.main import app


def _login(client: TestClient, username: str, password: str = "password123"):
    return client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )


def test_admin_can_deactivate_and_delete_another_user():
    client = TestClient(app)
    admin = _login(client, "admin")
    assert admin.status_code == 200, admin.text
    headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}
    username = f"temp_worker_{uuid.uuid4().hex[:8]}"

    created = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "password": "password123",
            "full_name": "Temporary Worker",
            "role": "FIELD_WORKER",
            "district": "Jaipur",
        },
        headers=headers,
    )
    assert created.status_code == 200, created.text
    user_id = created.json()["user"]["id"]

    blocked = client.patch(
        f"/api/v1/auth/users/{user_id}/active",
        json={"is_active": False},
        headers=headers,
    )
    assert blocked.status_code == 200, blocked.text
    assert blocked.json()["is_active"] is False

    denied = _login(client, username)
    assert denied.status_code == 403
    assert "deactivated" in denied.json()["detail"].lower()

    stale = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {created.json()['access_token']}"},
    )
    assert stale.status_code == 401

    restored = client.patch(
        f"/api/v1/auth/users/{user_id}/active",
        json={"is_active": True},
        headers=headers,
    )
    assert restored.status_code == 200
    assert restored.json()["is_active"] is True
    assert _login(client, username).status_code == 200

    removed = client.delete(f"/api/v1/auth/users/{user_id}", headers=headers)
    assert removed.status_code == 200, removed.text
    listed = client.get("/api/v1/auth/users", headers=headers)
    assert listed.status_code == 200
    assert username not in {row["username"] for row in listed.json()}
    assert _login(client, username).status_code == 400


def test_admin_cannot_delete_self_or_the_last_system_admin():
    client = TestClient(app)
    admin = _login(client, "admin")
    headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}
    users = client.get("/api/v1/auth/users", headers=headers).json()
    own = next(row for row in users if row["username"] == "admin")
    assert client.delete(f"/api/v1/auth/users/{own['id']}", headers=headers).status_code == 400
    kept = client.patch(
        f"/api/v1/auth/users/{own['id']}/active",
        json={"is_active": False},
        headers=headers,
    )
    assert kept.status_code == 400


def test_field_worker_cannot_delete_users():
    client = TestClient(app)
    worker = _login(client, "field_worker")
    headers = {"Authorization": f"Bearer {worker.json()['access_token']}"}
    missing = client.delete("/api/v1/auth/users/does-not-exist", headers=headers)
    assert missing.status_code == 403
