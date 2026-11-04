from datetime import datetime, timedelta

from app.models.enums import ApplicationStatus
from app.rules_engine.rule_loader import rule_loader
from app.services.application_service import is_renewal_alert

SCHEME_IDS = {"IGNOAPS", "RVY", "AVYAY", "AB_PMJAY_70", "SACRED"}


def test_every_scheme_renews_annually():
    loaded = {scheme["scheme_id"]: scheme for scheme in rule_loader.list_schemes()}
    assert set(loaded) == SCHEME_IDS
    for scheme_id, scheme in loaded.items():
        assert scheme.get("renewal_period_days") == 365, scheme_id


def test_renewal_alert_window():
    now = datetime(2026, 11, 3, 12, 0, 0)
    soon = now + timedelta(days=10)
    later = now + timedelta(days=60)
    overdue = now - timedelta(days=2)

    assert is_renewal_alert(ApplicationStatus.APPROVED, soon, now) is True
    assert is_renewal_alert("APPROVED", soon, now) is True
    assert is_renewal_alert("APPROVED", later, now) is False
    assert is_renewal_alert(ApplicationStatus.APPROVED, overdue, now) is True
    assert is_renewal_alert(ApplicationStatus.RENEWAL_DUE, soon, now) is True
    assert is_renewal_alert("RENEWAL_DUE", overdue, now) is True
    assert is_renewal_alert("SUBMITTED", soon, now) is False
    assert is_renewal_alert(ApplicationStatus.SUBMITTED, soon, now) is False
    assert is_renewal_alert("APPROVED", None, now) is False
    assert is_renewal_alert(ApplicationStatus.RENEWAL_DUE, None, now) is False
