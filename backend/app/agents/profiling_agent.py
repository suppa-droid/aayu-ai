from typing import Dict, Any

def _as_bool(raw_data: Dict[str, Any], key: str, default: bool = True) -> bool:
    """A missing or null flag keeps the schema default. False stays False."""
    if key not in raw_data or raw_data.get(key) is None:
        return default
    return bool(raw_data.get(key))


class ProfilingAgent:
    def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes citizen demographic profile."""
        normalized = {
            "id": str(raw_data.get("id") or "temp-id"),
            "name": str(raw_data.get("name", "")).strip().title(),
            "age": int(raw_data.get("age", 0)),
            "gender": str(raw_data.get("gender", "Male")).capitalize(),
            "monthly_income": float(raw_data.get("monthly_income", 0.0)),
            "is_bpl": _as_bool(raw_data, "is_bpl", True),
            "caste_category": str(raw_data.get("caste_category", "General")),
            "disability_percentage": float(raw_data.get("disability_percentage", 0.0)),
            "state": str(raw_data.get("state", "")).strip(),
            "district": str(raw_data.get("district", "")).strip(),
            "mobile_number": str(raw_data.get("mobile_number", "")).strip(),
            "has_aadhaar": _as_bool(raw_data, "has_aadhaar", True),
            "has_bpl_card": _as_bool(raw_data, "has_bpl_card", True),
            "has_bank_account": _as_bool(raw_data, "has_bank_account", True)
        }
        return normalized

profiling_agent = ProfilingAgent()
