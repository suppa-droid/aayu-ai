from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.rules_engine.rule_loader import rule_loader
from app.services.application_service import is_renewal_alert

def _as_utc_naive(moment: datetime) -> datetime:
    if moment.tzinfo is None or moment.tzinfo.utcoffset(moment) is None:
        return moment
    return moment.astimezone(timezone.utc).replace(tzinfo=None)


def _coerce_due(value) -> Optional[datetime]:
    if isinstance(value, datetime):
        return _as_utc_naive(value)
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    return _as_utc_naive(parsed)


class PlanningAgent:
    """Proactive Life-Event Engine that re-evaluates eligibility & schedules renewals."""
    def check_proactive_triggers(self, citizen: Dict[str, Any], renewal_applications=None) -> List[Dict[str, Any]]:
        triggers = []
        age = citizen.get("age", 60)

        # Milestone 1: Age 70 AB_PMJAY Universal Cover
        if age == 69:
            triggers.append({
                "type": "AGE_MILESTONE_UPCOMING",
                "scheme_id": "AB_PMJAY_70",
                "message": "Senior citizen turns 70 next year. Pre-prepare Aadhaar e-KYC for Ayushman Bharat 70+ Universal Cover."
            })
        elif age == 70:
            triggers.append({
                "type": "AGE_MILESTONE_REACHED",
                "scheme_id": "AB_PMJAY_70",
                "message": "Senior citizen reached age 70! Eligible for universal Rs. 5 Lakh family health cover."
            })

        # Milestone 2: Age 80 IGNOAPS Higher Pension Tier (Rs 500 -> Rs 800)
        if age == 80:
            triggers.append({
                "type": "PENSION_TIER_UPGRADE",
                "scheme_id": "IGNOAPS",
                "message": "Senior citizen reached age 80! IGNOAPS pension rate upgrades from Rs. 500 to Rs. 800/month."
            })

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for item in renewal_applications or []:
            due = _coerce_due(item.get("renewal_due_at"))
            if not is_renewal_alert(item.get("status"), due, now):
                continue
            label = item.get("scheme_name") or item.get("scheme_id") or "Scheme"
            triggers.append({
                "type": "ANNUAL_RENEWAL_DUE",
                "scheme_id": item.get("scheme_id"),
                "message": f"{label} renewal due on {due.date().isoformat()}.",
            })

        return triggers

    def build_application_roadmaps(self, citizen: Dict[str, Any], eligible_scheme_ids: List[str]) -> List[Dict[str, Any]]:
        """Per-scheme filing plans consumed by the field kiosk roadmap cards."""
        roadmaps = []
        aadhaar_linked = citizen.get("has_aadhaar", True) is not False
        for scheme_id in eligible_scheme_ids:
            scheme = rule_loader.get_scheme(scheme_id)
            if not scheme:
                continue
            docs = list(scheme.get("required_documents") or [])
            benefit = scheme.get("benefit_details") or {}
            benefit_text = "; ".join(f"{k.replace('_', ' ')}: {v}" for k, v in benefit.items()) or scheme.get("name", scheme_id)
            first_doc = docs[0] if docs else "available identity proof"
            roadmaps.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme.get("name", scheme_id),
                "total_estimated_days": 22,
                "immediate_action": f"Collect {first_doc} and file {scheme.get('name', scheme_id)} from this kiosk.",
                "dispute_risk": (
                    "Low — identity documents are linked."
                    if aadhaar_linked
                    else "Elevated — Aadhaar is not linked, so a name mismatch can stall disbursement."
                ),
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Collect eligibility documents",
                        "description": f"Confirm {', '.join(docs) if docs else 'identity proof'} before the application leaves the village.",
                        "required_documents": docs,
                        "estimated_days": 3,
                    },
                    {
                        "step_number": 2,
                        "title": "File at the field kiosk",
                        "description": "Submit the application so the district queue can verify the scan and the rule result together.",
                        "required_documents": [],
                        "estimated_days": 5,
                    },
                    {
                        "step_number": 3,
                        "title": "District approval and benefit start",
                        "description": benefit_text,
                        "required_documents": [],
                        "estimated_days": 14,
                    },
                ],
            })
        return roadmaps

planning_agent = PlanningAgent()
