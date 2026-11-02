from typing import Dict, Any, List, Tuple
from app.rules_engine.rule_loader import rule_loader
from app.models.enums import EligibilityStatus

class DeterministicRulesEngine:
    def __init__(self):
        self.loader = rule_loader

    def evaluate_rule(self, rule: Dict[str, Any], citizen: Dict[str, Any]) -> Tuple[bool, str]:
        operator = rule.get("operator")
        description = rule.get("description", "")

        # OR-group: pass when any nested condition passes (e.g. BPL or income ceiling).
        if operator == "any":
            passed_any = False
            for cond in rule.get("conditions") or []:
                ok, _msg = self.evaluate_rule(cond, citizen)
                if ok:
                    passed_any = True
                    break
            reason = f"[{'PASSED' if passed_any else 'FAILED'}] {description}"
            return passed_any, reason

        field = rule.get("field")
        target_val = rule.get("value")

        citizen_val = citizen.get(field)
        if citizen_val is None:
            return False, f"Missing data attribute '{field}' for citizen."

        matched = False
        try:
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
            else:
                return False, f"[FAILED] Unsupported operator '{operator}' on {field}"
        except (TypeError, ValueError):
            return False, f"[FAILED] Could not compare {field}={citizen_val} with {operator} {target_val}"

        reason = f"[{'PASSED' if matched else 'FAILED'}] {description} (Actual: {field}={citizen_val})"
        return matched, reason

    def _flag(self, citizen: Dict[str, Any], key: str, default: bool = True) -> bool:
        """Missing or null credentials keep the schema default instead of becoming False."""
        if key not in citizen or citizen.get(key) is None:
            return default
        return bool(citizen.get(key))

    def _missing_documents(self, scheme: Dict[str, Any], citizen: Dict[str, Any]) -> List[str]:
        """Demographic rules can pass while a required credential is still absent.

        A BPL certificate is required only when the citizen is actually BPL.
        Schemes such as Rashtriya Vayoshri also accept an income ceiling, so a
        non-BPL applicant who already passed that rule is not held back for a
        card they do not need.
        """
        gaps = []
        for doc in scheme.get("required_documents") or []:
            label = str(doc).lower()
            if "aadhaar" in label and not self._flag(citizen, "has_aadhaar"):
                gaps.append(f"Missing document: {doc}")
            elif "bpl" in label and self._flag(citizen, "is_bpl") and not self._flag(citizen, "has_bpl_card"):
                gaps.append(f"Missing document: {doc}")
            elif "bank" in label and not self._flag(citizen, "has_bank_account"):
                gaps.append(f"Missing document: {doc}")
        return gaps

    def evaluate_scheme(self, scheme_id: str, citizen: Dict[str, Any]) -> Dict[str, Any]:
        scheme = self.loader.get_scheme(scheme_id)
        if not scheme:
            return {
                "scheme_id": scheme_id,
                "scheme_name": scheme_id,
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

        # A failed hard rule is a rejection. Conditional means every rule passed
        # but a required identity or bank document is still missing.
        if passed_rules == total_rules:
            doc_gaps = self._missing_documents(scheme, citizen)
            if doc_gaps:
                status = EligibilityStatus.CONDITIONALLY_ELIGIBLE
                unmatched_criteria.extend(doc_gaps)
            else:
                status = EligibilityStatus.ELIGIBLE
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
