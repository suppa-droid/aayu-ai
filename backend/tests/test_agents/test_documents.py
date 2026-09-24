from app.agents.document_verification_agent import document_verification_agent, names_match

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
    assert not names_match("Ramesh Kumar", "Suresh Kumar")
