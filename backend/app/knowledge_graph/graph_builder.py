from typing import Dict, Any, List
from app.knowledge_graph.schema import DependencyGraphSchema, GraphNode, GraphEdge

class SchemeKnowledgeGraph:
    def __init__(self):
        self.nodes = [
            GraphNode(id="IGNOAPS", name="IGNOAPS Pension", category="Social Security", min_age=60),
            GraphNode(id="AVYAY", name="Atal Vayo Abhyuday Yojana", category="Shelter & Care", min_age=60),
            GraphNode(id="RVY", name="Rashtriya Vayoshri Yojana", category="Assistive Devices", min_age=60),
            GraphNode(id="AB_PMJAY_70", name="Ayushman Bharat 70+", category="Health Insurance", min_age=70),
            GraphNode(id="SACRED", name="SACRED Employment Portal", category="Livelihood", min_age=60),
        ]
        self.edges = [
            GraphEdge(
                source="IGNOAPS",
                target="RVY",
                relationship="PREREQUISITE_FOR",
                description="IGNOAPS registration serves as proof of BPL status for Rashtriya Vayoshri device allocation."
            ),
            GraphEdge(
                source="IGNOAPS",
                target="AB_PMJAY_70",
                relationship="PROGRESSION_TO",
                description="Upon turning 70, IGNOAPS beneficiaries automatically qualify for Ayushman Bharat 70+ Universal Cover."
            )
        ]

    def get_graph_schema(self) -> DependencyGraphSchema:
        return DependencyGraphSchema(nodes=self.nodes, edges=self.edges)

knowledge_graph = SchemeKnowledgeGraph()
