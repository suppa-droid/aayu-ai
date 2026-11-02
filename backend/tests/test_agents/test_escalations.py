from fastapi.testclient import TestClient

from app.main import app


def _login(client: TestClient, username: str) -> str:
    res = client.post("/api/v1/auth/login", data={"username": username, "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_admin_can_approve_a_field_escalation():
    client = TestClient(app)
    field = _login(client, "field_worker")
    created = client.post(
        "/api/v1/admin/district/escalate",
        json={
            "application_id": "00000000-0000-0000-0000-000000000001",
            "reason": "NAME_MISMATCH",
            "description": '[Document Verification] Citizen: "Approve Check" | Doc: Aadhaar Card',
            "field_worker_id": "field_worker",
        },
        headers={"Authorization": f"Bearer {field}"},
    )
    assert created.status_code == 200, created.text
    ticket_id = created.json()["id"]

    admin = _login(client, "admin")
    approved = client.post(
        f"/api/v1/admin/district/escalations/{ticket_id}/resolve",
        json={"resolution_notes": "Name accepted after a physical check."},
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert approved.status_code == 200, approved.text
    body = approved.json()
    assert body["status"] == "RESOLVED"
    assert body["escalation"]["status"] == "RESOLVED"
    assert "physical check" in body["escalation"]["suggested_ai_resolution"]

    open_rows = client.get(
        "/api/v1/admin/district/escalations",
        params={"status": "OPEN"},
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert open_rows.status_code == 200
    assert all(row["id"] != ticket_id for row in open_rows.json())

    resolved = client.get(
        "/api/v1/admin/district/escalations",
        params={"status": "RESOLVED"},
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert any(row["id"] == ticket_id for row in resolved.json())


def test_health_lists_seven_agents_not_the_orchestrator():
    client = TestClient(app)
    admin = _login(client, "admin")
    health = client.get(
        "/api/v1/admin/system/pipeline-health",
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert health.status_code == 200, health.text
    names = health.json()["active_agents"]
    assert len(names) == 7
    assert "OrchestratorStateMachine" not in names
    assert health.json()["pipeline_steps"] == [
        "ProfilingAgent",
        "EligibilityAgent",
        "RecommendationAgent",
        "PlanningAgent",
    ]
