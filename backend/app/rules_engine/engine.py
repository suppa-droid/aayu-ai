from typing import Dict, Any, List, Tuple
from app.rules_engine.rule_loader import rule_loader
from app.models.enums import EligibilityStatus

class DeterministicRulesEngine:
    def __init__(self):
        self.loader = rule_loader

    def evaluate_rule(self, rule: Dict[str, Any], citizen: Dict[str, Any]) -> Tuple[bool, str]:
        field = rule.get("field")
        operator = rule.get("operator")
        target_val = rule.get("value")
        description = rule.get("description", "")

        citizen_val = citizen.get(field)
        if citizen_val is None:
            return False, f"Missing data attribute '{field}' for citizen."

        matched = False
        if operator == "==":
            matched = (citizen_val == target_val)
        elif operator == ">=":
            matched = (float(citizen_val) >= float(target_val))
        elif operator == "<=":
            matched = (float(citizen_val) <= float(target_val))
        elif operator == ">":
            matched = (float(citizen_val) > float(target_val))
        elif operator == "<":
            matched = (float(citizen_val) < float(target_val))

        reason = f"[{'PASSED' if matched else 'FAILED'}] {description} (Actual: {field}={citizen_val})"
        return matched, reason

    def evaluate_scheme(self, scheme_id: str, citizen: Dict[str, Any]) -> Dict[str, Any]:
        scheme = self.loader.get_scheme(scheme_id)
        if not scheme:
            return {
                "status": EligibilityStatus.INELIGIBLE,
                "score": 0.0,
                "matched_criteria": [],
                "unmatched_criteria": [f"Scheme '{scheme_id}' does not exist."],
                "missing_fields": []
            }

        rules = scheme.get("rules", [])
        matched_criteria = []
        unmatched_criteria = []
        total_rules = len(rules)
        passed_rules = 0

        for rule in rules:
            passed, msg = self.evaluate_rule(rule, citizen)
            if passed:
                passed_rules += 1
                matched_criteria.append(msg)
            else:
                unmatched_criteria.append(msg)

        score = (passed_rules / total_rules) * 100.0 if total_rules > 0 else 100.0

        if passed_rules == total_rules:
            status = EligibilityStatus.ELIGIBLE
        elif passed_rules > 0:
            status = EligibilityStatus.CONDITIONALLY_ELIGIBLE
        else:
            status = EligibilityStatus.INELIGIBLE

        return {
            "scheme_id": scheme_id,
            "scheme_name": scheme.get("name"),
            "status": status,
            "score": score,
            "matched_criteria": matched_criteria,
            "unmatched_criteria": unmatched_criteria
        }

rules_engine = DeterministicRulesEngine()
