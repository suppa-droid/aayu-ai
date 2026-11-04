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
    assert result["recommendation_package"]["summary"]
    assert result["recommendation_package"]["voice_briefing_script"]
    assert len(result["roadmaps"]) == result["eligible_count"]
    assert result["roadmaps"][0]["steps"]
    assert all(
        trigger.get("type") != "ANNUAL_RENEWAL_DUE"
        for trigger in result["proactive_triggers"]
    )
