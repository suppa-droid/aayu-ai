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

def test_partial_rule_match_is_ineligible():
    citizen = {
        "age": 55,
        "is_bpl": True,
        "monthly_income": 2000.0
    }
    res = rules_engine.evaluate_scheme("IGNOAPS", citizen)
    assert res["status"] == "INELIGIBLE"

def test_rvy_accepts_income_or_bpl():
    by_income = rules_engine.evaluate_scheme("RVY", {
        "age": 65,
        "is_bpl": False,
        "monthly_income": 2500,
    })
    assert by_income["status"] == "ELIGIBLE"
    neither = rules_engine.evaluate_scheme("RVY", {
        "age": 65,
        "is_bpl": False,
        "monthly_income": 8000,
    })
    assert neither["status"] == "INELIGIBLE"

def test_rvy_income_path_does_not_require_bpl_card():
    res = rules_engine.evaluate_scheme("RVY", {
        "age": 65,
        "is_bpl": False,
        "monthly_income": 2500,
        "has_aadhaar": True,
        "has_bpl_card": False,
        "has_bank_account": True,
    })
    assert res["status"] == "ELIGIBLE"

def test_rvy_bpl_without_card_is_conditional():
    res = rules_engine.evaluate_scheme("RVY", {
        "age": 65,
        "is_bpl": True,
        "monthly_income": 8000,
        "has_aadhaar": True,
        "has_bpl_card": False,
        "has_bank_account": True,
    })
    assert res["status"] == "CONDITIONALLY_ELIGIBLE"

def test_missing_aadhaar_is_conditional():
    citizen = {
        "age": 65,
        "is_bpl": True,
        "monthly_income": 2000.0,
        "has_aadhaar": False,
        "has_bpl_card": True,
        "has_bank_account": True,
    }
    res = rules_engine.evaluate_scheme("IGNOAPS", citizen)
    assert res["status"] == "CONDITIONALLY_ELIGIBLE"
