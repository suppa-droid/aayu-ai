from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.rules_engine.rule_loader import rule_loader
from app.knowledge_graph.graph_builder import knowledge_graph
from app.core.security import get_current_user

router = APIRouter(prefix="/schemes", tags=["Schemes & Knowledge Graph"], dependencies=[Depends(get_current_user)])

@router.get("/")
def list_schemes():
    return rule_loader.list_schemes()

@router.get("/graph")
def get_scheme_dependency_graph():
    return knowledge_graph.get_graph_schema().model_dump()
