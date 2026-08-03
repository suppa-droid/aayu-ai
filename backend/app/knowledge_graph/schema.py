from pydantic import BaseModel
from typing import List, Optional

class GraphNode(BaseModel):
    id: str
    name: str
    category: str
    min_age: int

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str = "PREREQUISITE_FOR"  # e.g., IGNOAPS -> RVY, IGNOAPS -> AB_PMJAY_70
    description: str

class DependencyGraphSchema(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
