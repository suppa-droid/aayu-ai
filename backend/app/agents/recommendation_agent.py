import logging
from typing import Dict, Any, List
from app.knowledge_graph.graph_queries import graph_query_engine
from app.core.llm import get_llm

logger = logging.getLogger(__name__)


class RecommendationAgent:
    async def recommend_roadmap(self, citizen: Dict[str, Any], eligible_schemes: List[str]) -> List[Dict[str, Any]]:
        age = citizen.get("age", 60)
        base_roadmap = graph_query_engine.generate_roadmap(eligible_schemes, age)

        llm = get_llm(temperature=0.7)
        if llm and eligible_schemes:
            prompt = f"""
            You are an AI assistant helping a Field Worker explain welfare benefits to a senior citizen in India.
            Citizen Name: {citizen.get('name')}
            Age: {age}
            Gender: {citizen.get('gender')}
            Income: {citizen.get('monthly_income')}

            They are eligible for these schemes: {', '.join(eligible_schemes)}

            Write a short, friendly, personalized paragraph (max 2 sentences) summarizing their action plan. No bold markdown, just plain text.
            """
            try:
                response = await llm.ainvoke(prompt)

                # Safely extract text regardless of whether content is str or list
                raw = response.content
                if isinstance(raw, list):
                    parts = []
                    for block in raw:
                        if isinstance(block, dict):
                            parts.append(block.get("text", ""))
                        else:
                            parts.append(str(block))
                    ai_summary = "".join(parts).strip()
                else:
                    ai_summary = str(raw).strip()
                import re
                ai_summary = re.sub(r"<think>.*?</think>", "", ai_summary, flags=re.DOTALL).strip()

                if ai_summary:
                    base_roadmap.insert(0, {
                        "step": 0,
                        "action": "🤖 AI Personalized Summary",
                        "details": ai_summary,
                        "timeline": "Immediate"
                    })
            except Exception as e:
                logger.warning(f"LLM recommendation summary failed: {e}")

        return base_roadmap


recommendation_agent = RecommendationAgent()
