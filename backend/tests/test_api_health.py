"""Route and retrieval defects found by the module health pass."""
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.rag.retriever import SchemeRAGRetriever
from app.rag.vector_store import FAISSVectorStore


def _login(client: TestClient, username: str) -> str:
    res = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": "password123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_missing_and_bad_token_are_401():
    client = TestClient(app)
    missing = client.get("/api/v1/auth/me")
    assert missing.status_code == 401
    bad = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert bad.status_code == 401


def test_field_worker_is_forbidden_on_admin_routes():
    client = TestClient(app)
    token = _login(client, "field_worker")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/auth/users", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/system/pipeline-health", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/system/analytics", headers=headers).status_code == 403
    patched = client.patch(
        "/api/v1/applications/does-not-exist/status",
        params={"status": "APPROVED"},
        headers=headers,
    )
    assert patched.status_code == 403


def test_unknown_reminder_and_unknown_citizen_are_404():
    client = TestClient(app)
    token = _login(client, "field_worker")
    headers = {"Authorization": f"Bearer {token}"}
    missing = client.post("/api/v1/reminders/trigger/not-a-real-reminder", headers=headers)
    assert missing.status_code == 404
    bad_citizen = client.post(
        "/api/v1/reminders/",
        json={
            "citizen_id": "does-not-exist-qa-health",
            "scheme_id": "IGNOAPS",
            "channel": "SMS",
            "trigger_type": "RENEWAL",
            "scheduled_for": "2026-12-01T00:00:00",
            "message": "should not persist",
        },
        headers=headers,
    )
    assert bad_citizen.status_code == 404


def test_keyword_search_skips_unrelated_text_before_embeddings_exist(monkeypatch):
    store = FAISSVectorStore()
    store.chunks = ["Scheme: IGNOAPS pension amount is 500 rupees for seniors."]
    store.metadata = [{"scheme_id": "IGNOAPS", "scheme_name": "IGNOAPS"}]

    def boom():
        raise AssertionError("embeddings are not ready; do not load the model")

    monkeypatch.setattr("app.rag.vector_store._get_model", boom)
    assert store.search("blorptang xylophone quantum") == []
    assert store.search("for the and") == []
    hits = store.search("What is the IGNOAPS pension?")
    assert len(hits) == 1
    assert hits[0]["scheme_id"] == "IGNOAPS"


def test_semantic_search_drops_unrelated_chunks(monkeypatch):
    store = FAISSVectorStore()
    store.chunks = ["IGNOAPS pension rules", "RVY hearing aids"]
    store.metadata = [
        {"scheme_id": "IGNOAPS", "scheme_name": "IGNOAPS"},
        {"scheme_id": "RVY", "scheme_name": "RVY"},
    ]
    store.embeddings = [
        np.array([1.0, 0.0, 0.0], dtype=np.float32),
        np.array([0.0, 1.0, 0.0], dtype=np.float32),
    ]

    class FakeModel:
        def encode(self, text, convert_to_numpy=True):
            if "blorptang" in str(text):
                return np.array([0.0, 0.0, 1.0], dtype=np.float32)
            return np.array([1.0, 0.0, 0.0], dtype=np.float32)

    monkeypatch.setattr("app.rag.vector_store._get_model", lambda: FakeModel())
    assert store.search("blorptang xylophone") == []
    hits = store.search("IGNOAPS pension")
    assert len(hits) == 1
    assert hits[0]["scheme_id"] == "IGNOAPS"


def test_retriever_does_not_attach_a_different_scheme(monkeypatch):
    class FakeStore:
        def search(self, query, top_k=4):
            return [{
                "text": "Unrelated Rashtriya Vayoshri benefit text",
                "score": 0.9,
                "scheme_id": "RVY",
                "scheme_name": "Rashtriya Vayoshri Yojana",
            }]

    monkeypatch.setattr("app.rag.retriever.vector_store", FakeStore())
    citations = SchemeRAGRetriever().retrieve_guidelines("IGNOAPS", query="income bpl age eligibility")
    assert citations == []
