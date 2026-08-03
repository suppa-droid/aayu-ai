from typing import Dict, Any, List
from datetime import datetime, timedelta

class PlanningAgent:
    """Proactive Life-Event Engine that re-evaluates eligibility & schedules renewals."""
    def check_proactive_triggers(self, citizen: Dict[str, Any]) -> List[Dict[str, Any]]:
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

        # Milestone 3: Annual BPL/Income Certificate Renewal
        triggers.append({
            "type": "ANNUAL_RENEWAL_DUE",
            "scheme_id": "IGNOAPS",
            "message": "Annual BPL income re-verification due in 30 days."
        })

        return triggers

planning_agent = PlanningAgent()
