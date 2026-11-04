from typing import Dict, Any, List
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END
from app.agents.profiling_agent import profiling_agent
from app.agents.eligibility_agent import eligibility_agent
from app.agents.recommendation_agent import recommendation_agent
from app.agents.planning_agent import planning_agent
from app.rules_engine.rule_loader import rule_loader

# Define the state schema for our LangGraph
class CitizenEvaluationState(TypedDict):
    raw_citizen_data: Dict[str, Any]
    profile: Dict[str, Any]
    evaluations: List[Dict[str, Any]]
    eligible_scheme_ids: List[str]
    roadmap: List[Any]
    recommendation_package: Dict[str, Any]
    roadmaps: List[Dict[str, Any]]
    proactive_triggers: List[Any]
    total_schemes_evaluated: int

# ── Node functions ───────────────────────────────────────────────────────────

def profiling_node(state: CitizenEvaluationState):
    profile = profiling_agent.process(state["raw_citizen_data"])
    return {"profile": profile}

def eligibility_node(state: CitizenEvaluationState):
    profile = state["profile"]
    schemes = rule_loader.list_schemes()
    evaluations = []
    eligible_scheme_ids = []

    for s in schemes:
        scheme_id = s["scheme_id"]
        eval_res = eligibility_agent.evaluate(profile, scheme_id)
        evaluations.append(eval_res.model_dump())
        if eval_res.status == "ELIGIBLE":
            eligible_scheme_ids.append(scheme_id)

    return {
        "evaluations": evaluations,
        "eligible_scheme_ids": eligible_scheme_ids,
        "total_schemes_evaluated": len(schemes)
    }

async def recommendation_node(state: CitizenEvaluationState):
    """Async node — LangGraph ainvoke() handles this correctly."""
    package = await recommendation_agent.build_recommendation(
        state["profile"], state["eligible_scheme_ids"]
    )
    return {
        "roadmap": package["sequence"],
        "recommendation_package": {
            "summary": package["summary"],
            "voice_briefing_script": package["voice_briefing_script"],
            "eligible_schemes": package["eligible_schemes"],
        },
    }

def planning_node(state: CitizenEvaluationState):
    profile = state["profile"]
    renewal_applications = state["raw_citizen_data"].get("renewal_applications") or []
    return {
        "proactive_triggers": planning_agent.check_proactive_triggers(profile, renewal_applications),
        "roadmaps": planning_agent.build_application_roadmaps(profile, state["eligible_scheme_ids"]),
    }

# ── Build the graph ──────────────────────────────────────────────────────────
workflow = StateGraph(CitizenEvaluationState)

workflow.add_node("profiling", profiling_node)
workflow.add_node("eligibility", eligibility_node)
workflow.add_node("recommendation", recommendation_node)
workflow.add_node("planning", planning_node)

workflow.add_edge("profiling", "eligibility")
workflow.add_edge("eligibility", "recommendation")
workflow.add_edge("recommendation", "planning")
workflow.add_edge("planning", END)

workflow.set_entry_point("profiling")
app_graph = workflow.compile()


class VayoSetuOrchestrator:
    """
    True LangGraph Multi-Agent State Machine Routing Logic.
    Use run_full_pipeline_async() from async contexts (FastAPI endpoints).
    """

    async def run_full_pipeline_async(self, raw_citizen_data: Dict[str, Any]) -> Dict[str, Any]:
        """Async version — safe to call from FastAPI async endpoints."""
        initial_state = {
            "raw_citizen_data": raw_citizen_data,
            "profile": {},
            "evaluations": [],
            "eligible_scheme_ids": [],
            "roadmap": [],
            "recommendation_package": {
                "summary": "",
                "voice_briefing_script": "",
                "eligible_schemes": [],
            },
            "roadmaps": [],
            "proactive_triggers": [],
            "total_schemes_evaluated": 0
        }

        # ainvoke handles mixed sync/async nodes correctly
        final_state = await app_graph.ainvoke(initial_state)

        return {
            "profile": final_state["profile"],
            "evaluations": final_state["evaluations"],
            "roadmap": final_state["roadmap"],
            "recommendation_package": final_state.get("recommendation_package") or {},
            "roadmaps": final_state.get("roadmaps") or [],
            "proactive_triggers": final_state["proactive_triggers"],
            "eligible_count": len(final_state["eligible_scheme_ids"]),
            "total_schemes_evaluated": final_state["total_schemes_evaluated"]
        }

    def run_full_pipeline(self, raw_citizen_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sync wrapper for tests and scripts that are not already inside an event loop."""
        import asyncio
        return asyncio.run(self.run_full_pipeline_async(raw_citizen_data))

orchestrator = VayoSetuOrchestrator()
