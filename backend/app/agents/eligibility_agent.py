from typing import Dict, Any, List
from app.rules_engine.engine import rules_engine
from app.rag.retriever import rag_retriever
from app.agents.explainability_agent import explainability_agent
from app.models.schemas import EligibilityEvaluationResponse

class EligibilityAgent:
    def evaluate(self, citizen: Dict[str, Any], scheme_id: str) -> EligibilityEvaluationResponse:
        # Step 1: Deterministic Engine Evaluation
        result = rules_engine.evaluate_scheme(scheme_id, citizen)
        
        # Step 2: RAG Vector Store Retrieval
        citations = rag_retriever.retrieve_guidelines(scheme_id, query="income bpl age eligibility")
        
        # Step 3: Counterfactual Generation
        counterfactual = explainability_agent.generate_counterfactual(
            scheme_id=scheme_id,
            citizen=citizen,
            unmatched_criteria=result["unmatched_criteria"]
        )

        return EligibilityEvaluationResponse(
            citizen_id=str(citizen.get("id") or "temp-id"),
            scheme_id=scheme_id,
            scheme_name=result["scheme_name"],
            status=result["status"],
            score=result["score"],
            matched_criteria=result["matched_criteria"],
            unmatched_criteria=result["unmatched_criteria"],
            counterfactual=counterfactual,
            rag_citations=citations
        )

eligibility_agent = EligibilityAgent()
