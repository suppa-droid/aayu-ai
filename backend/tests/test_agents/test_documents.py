from app.agents.document_verification_agent import document_verification_agent, names_match
from app.api.v1.admin_field import queue_document_escalation
from app.api.v1.webhooks import whatsapp_reply

def test_demo_filenames_are_deterministic():
    agent = document_verification_agent
    blur = agent._smart_simulation("Aadhaar Card", "Ramesh Kumar", "blurry_image.jpg", b"x")
    mismatch = agent._smart_simulation("Aadhaar Card", "Ramesh Kumar", "name_mismatch.jpg", b"x")
    matched = agent._smart_simulation("Aadhaar Card", "Ramesh Kumar", "matching_aadhaar.jpg", b"x")
    real = agent._smart_simulation("Aadhaar Card", "Ramesh Kumar", "scan.jpg", b"x" * 5000)
    assert blur["status"] == "FLAGGED_QUALITY"
    assert mismatch["status"] == "FLAGGED_MISMATCH"
    assert matched["status"] == "VERIFIED"
    assert real["status"] == "VISION_AI_UNAVAILABLE"
    assert real["is_valid"] is False

def test_name_match_ignores_case_and_order():
    assert names_match("Ramesh Kumar", "KUMAR RAMESH")
    assert names_match("Ramesh Kumar", "Ramesh Kumar Singh")
    assert not names_match("Ramesh Kumar", "Suresh Kumar")
    assert not names_match("Ramesh Kumar", "Kumar")

def test_flagged_scan_is_queued_and_verified_scan_is_not():
    class FakeDb:
        def __init__(self):
            self.added = []
        def add(self, row):
            self.added.append(row)
        def commit(self):
            return None
        def refresh(self, row):
            row.id = "ticket-1"
        def query(self, *_args, **_kwargs):
            return self

    verified = {"escalate_level": None, "status": "VERIFIED"}
    assert queue_document_escalation(FakeDb(), verified, "Aadhaar Card", "Ramesh Kumar", "field_worker") is None

    flagged = {
        "escalate_level": 2,
        "status": "FLAGGED_MISMATCH",
        "issue": "Name mismatch",
    }
    db = FakeDb()
    # The service queries applications. Give the fake query no rows.
    db.filter = lambda *_a, **_k: db
    db.first = lambda: None
    ticket_id = queue_document_escalation(db, flagged, "Aadhaar Card", "Ramesh Kumar", "field_worker")
    assert ticket_id == "ticket-1"
    assert db.added[0].reason.value == "NAME_MISMATCH"
    assert db.added[0].status == "OPEN"
    assert "Ramesh Kumar" in db.added[0].description
    assert db.added[0].field_worker_id == "field_worker"

def test_whatsapp_replies_are_not_dropped():
    assert "home visit" in whatsapp_reply("1").lower()
    assert "Aadhaar" in whatsapp_reply("2")
    assert "Reply '1'" in whatsapp_reply("hello")
    assert "Reply '1'" in whatsapp_reply("I am 71")

def test_real_filenames_are_not_auto_approved():
    agent = document_verification_agent
    for name in ("photo_matching_name.jpg", "another.jpg", "yellow_low_light.jpg", "mother.jpg"):
        result = agent._smart_simulation("Aadhaar Card", "Ramesh Kumar", name, b"x" * 5000)
        assert result["status"] == "VISION_AI_UNAVAILABLE"
        assert result["is_valid"] is False
