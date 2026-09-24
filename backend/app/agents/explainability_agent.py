from typing import Dict, Any, List
from app.models.schemas import CounterfactualExplanation

class CounterfactualExplainabilityAgent:
    def generate_counterfactual(
        self,
        scheme_id: str,
        citizen: Dict[str, Any],
        unmatched_criteria: List[str]
    ) -> CounterfactualExplanation:
        missing_criteria = []
        actionable_steps = []
        qualifying_scenarios = []

        age = citizen.get("age", 0)
        income = citizen.get("monthly_income", 0.0)
        is_bpl = citizen.get("is_bpl", True)

        if scheme_id == "IGNOAPS":
            if age < 60:
                missing_criteria.append(f"Age is currently {age} years (Required: >= 60).")
                qualifying_scenarios.append(f"Will qualify automatically upon turning 60 (in {60 - age} years).")
                actionable_steps.append("Register birth/age proof certificate in advance with Panchayat.")

            if income > 2500:
                missing_criteria.append(f"Monthly household income is Rs. {income:,.2f} (Required: <= Rs. 2,500).")
                qualifying_scenarios.append("If updated Income Certificate issued by Tehsildar shows household income below Rs. 2,500.")
                actionable_steps.append("Apply for updated family income verification at Tehsil / CSC kiosk.")

            if not is_bpl:
                missing_criteria.append("Applicant is not currently flagged as Below Poverty Line (BPL).")
                qualifying_scenarios.append("If beneficiary is enrolled in State BPL Ration Register.")
                actionable_steps.append("Submit BPL Inclusion application to District Social Welfare Officer.")

        elif scheme_id == "AB_PMJAY_70":
            if age < 70:
                missing_criteria.append(f"Age is currently {age} years (Required: >= 70 for Universal Senior Cover).")
                qualifying_scenarios.append(f"Will unlock universal Rs. 5 Lakh family cover automatically when reaching age 70 (in {70 - age} years).")
                actionable_steps.append("Ensure e-KYC on Aadhaar is completed in advance.")

        elif scheme_id == "RVY":
            if not is_bpl and income > 3000:
                missing_criteria.append(f"Monthly income Rs. {income:,.2f} exceeds Rs. 3,000 threshold for non-BPL applicants.")
                qualifying_scenarios.append("If medical officer certifies age-related disability or infirmity alongside BPL card.")
                actionable_steps.append("Visit ALIMCO assessment camp or District Civil Hospital for disability screening.")

        if not missing_criteria:
            if unmatched_criteria:
                missing_criteria = list(unmatched_criteria)
                qualifying_scenarios = [
                    "Demographic rules are met, but the listed documents or conditions are still open."
                ]
                actionable_steps = [
                    "Collect the missing documents at the field kiosk and run verification again before submission."
                ]
            else:
                missing_criteria = ["None - Citizen is fully eligible!"]
                qualifying_scenarios = ["Citizen currently satisfies all documented criteria."]
                actionable_steps = ["Proceed to document verification and application submission."]

        return CounterfactualExplanation(
            missing_criteria=missing_criteria,
            actionable_steps=actionable_steps,
            qualifying_scenarios=qualifying_scenarios
        )

explainability_agent = CounterfactualExplainabilityAgent()
