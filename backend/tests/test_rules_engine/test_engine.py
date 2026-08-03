from app.rules_engine.engine import rules_engine

def test_ignoaps_eligibility_passed():
    citizen = {
        "age": 65,
        "is_bpl": True,
        "monthly_income": 2000.0
    }
    res = rules_engine.evaluate_scheme("IGNOAPS", citizen)
    assert res["status"] == "ELIGIBLE"
    assert res["score"] == 100.0

def test_ignoaps_eligibility_failed():
    citizen = {
        "age": 55,
        "is_bpl": False,
        "monthly_income": 4000.0
    }
    res = rules_engine.evaluate_scheme("IGNOAPS", citizen)
    assert res["status"] == "INELIGIBLE"
    assert res["score"] == 0.0
