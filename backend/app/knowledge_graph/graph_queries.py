from typing import List, Dict, Any
from app.knowledge_graph.graph_builder import knowledge_graph

class GraphQueryEngine:
    def generate_roadmap(self, eligible_scheme_ids: List[str], age: int) -> List[Dict[str, Any]]:
        graph = knowledge_graph.get_graph_schema()
        roadmap = []

        # Step 1: Base Pension & Primary Schemes
        if "IGNOAPS" in eligible_scheme_ids:
            roadmap.append({
                "step": 1,
                "scheme_id": "IGNOAPS",
                "name": "IGNOAPS Pension",
                "reason": "Foundational pension providing direct monthly income disburser and verifying BPL identity."
            })

        # Step 2: Prerequisite-unlocked schemes
        if "RVY" in eligible_scheme_ids:
            roadmap.append({
                "step": 2,
                "scheme_id": "RVY",
                "name": "Rashtriya Vayoshri Assistive Devices",
                "reason": "Unlocked via IGNOAPS/BPL status for free spectacles, wheelchairs, and hearing aids."
            })

        # Step 3: Additional schemes (AVYAY / SACRED / AB_PMJAY_70)
        if "AVYAY" in eligible_scheme_ids:
            roadmap.append({
                "step": 3,
                "scheme_id": "AVYAY",
                "name": "Atal Vayo Abhyuday Yojana",
                "reason": "Provides community shelter, geriatric nutrition, and care home support."
            })

        if "SACRED" in eligible_scheme_ids:
            roadmap.append({
                "step": 4,
                "scheme_id": "SACRED",
                "name": "SACRED Senior Employment Portal",
                "reason": "Matches experienced seniors with flexible advisory or part-time community roles."
            })

        if "AB_PMJAY_70" in eligible_scheme_ids:
            roadmap.append({
                "step": 5,
                "scheme_id": "AB_PMJAY_70",
                "name": "Ayushman Bharat 70+ Universal Health Top-Up",
                "reason": "Universal Rs. 5 Lakh family healthcare coverage unlocked upon reaching age 70."
            })
        elif age < 70:
            roadmap.append({
                "step": 5,
                "scheme_id": "AB_PMJAY_70",
                "name": "Ayushman Bharat 70+ (Upcoming Milestone)",
                "reason": f"Will automatically unlock in {70 - age} years when turning age 70."
            })

        return roadmap

graph_query_engine = GraphQueryEngine()
