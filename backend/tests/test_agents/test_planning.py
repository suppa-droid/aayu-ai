from datetime import datetime, timedelta, timezone

from app.agents.planning_agent import planning_agent
from app.models.enums import ApplicationStatus


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_bpl_citizen_without_renewals_has_no_annual_trigger():
    triggers = planning_agent.check_proactive_triggers({"name": "Kamla Devi", "age": 69, "is_bpl": True})
    assert any(trigger["type"] == "AGE_MILESTONE_UPCOMING" for trigger in triggers)
    assert all(trigger["type"] != "ANNUAL_RENEWAL_DUE" for trigger in triggers)

    no_apps = planning_agent.check_proactive_triggers(
        {"name": "Kamla Devi", "age": 72, "is_bpl": True},
        renewal_applications=[],
    )
    assert all(trigger["type"] != "ANNUAL_RENEWAL_DUE" for trigger in no_apps)


def test_age_milestones_still_fire_without_a_renewal():
    reached = planning_agent.check_proactive_triggers({"age": 70, "is_bpl": True})
    assert any(trigger["type"] == "AGE_MILESTONE_REACHED" for trigger in reached)
    upgraded = planning_agent.check_proactive_triggers({"age": 80, "is_bpl": False})
    assert any(trigger["type"] == "PENSION_TIER_UPGRADE" for trigger in upgraded)
    assert all(trigger["type"] != "ANNUAL_RENEWAL_DUE" for trigger in reached + upgraded)


def test_renewal_due_in_ten_days_names_the_date():
    due = _utc_now() + timedelta(days=10)
    triggers = planning_agent.check_proactive_triggers(
        {"age": 72, "is_bpl": True},
        renewal_applications=[{
            "scheme_id": "IGNOAPS",
            "status": "APPROVED",
            "renewal_due_at": due,
            "scheme_name": "IGNOAPS",
        }],
    )
    annual = [trigger for trigger in triggers if trigger["type"] == "ANNUAL_RENEWAL_DUE"]
    assert len(annual) == 1
    assert due.date().isoformat() in annual[0]["message"]
    assert "IGNOAPS" in annual[0]["message"]


def test_iso_renewal_due_alerts_and_a_far_date_does_not():
    soon = _utc_now() + timedelta(days=10)
    later = _utc_now() + timedelta(days=60)
    triggers = planning_agent.check_proactive_triggers(
        {"age": 72, "is_bpl": False},
        renewal_applications=[
            {
                "scheme_id": "IGNOAPS",
                "status": ApplicationStatus.APPROVED,
                "renewal_due_at": soon.isoformat(),
                "scheme_name": "IGNOAPS",
            },
            {
                "scheme_id": "IGNOAPS",
                "status": "APPROVED",
                "renewal_due_at": later,
                "scheme_name": "IGNOAPS",
            },
        ],
    )
    annual = [trigger for trigger in triggers if trigger["type"] == "ANNUAL_RENEWAL_DUE"]
    assert len(annual) == 1
    assert soon.date().isoformat() in annual[0]["message"]
    assert later.date().isoformat() not in annual[0]["message"]
