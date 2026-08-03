from app.agents.orchestrator import orchestrator

def test_full_pipeline_execution():
    raw_citizen = {
        "name": "Savitri Devi",
        "age": 72,
        "gender": "Female",
        "monthly_income": 1800.0,
        "is_bpl": True,
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "mobile_number": "9876543210"
    }
    result = orchestrator.run_full_pipeline(raw_citizen)
    assert result["profile"]["name"] == "Savitri Devi"
    assert result["eligible_count"] > 0
    assert len(result["roadmap"]) > 0
