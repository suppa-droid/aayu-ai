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
                description="IGNOAPS can be used as BPL proof for Rashtriya Vayoshri. Applicants who are not BPL can still qualify with certified monthly income at or below Rs. 3,000."
            ),
            GraphEdge(
                source="IGNOAPS",
                target="AB_PMJAY_70",
                relationship="PROGRESSION_TO",
                description="Ayushman Bharat 70+ is universal at age 70. It does not require IGNOAPS. The pension is only an earlier step in the suggested filing order."
            )
        ]

    def get_graph_schema(self) -> DependencyGraphSchema:
        return DependencyGraphSchema(nodes=self.nodes, edges=self.edges)

knowledge_graph = SchemeKnowledgeGraph()
