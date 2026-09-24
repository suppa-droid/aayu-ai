import logging
from typing import Dict, Any, List
from app.knowledge_graph.graph_queries import graph_query_engine
from app.core.llm import get_llm

logger = logging.getLogger(__name__)


class RecommendationAgent:
    def _fallback_copy(self, citizen: Dict[str, Any], eligible_schemes: List[str]) -> Dict[str, str]:
        name = citizen.get("name") or "the citizen"
        if not eligible_schemes:
            summary = (
                f"{name} does not currently meet the hard rules for any loaded scheme. "
                "Use the counterfactual steps to close the gaps before filing."
            )
            voice = f"Namaste {name} ji. Abhi koi yojana poori tarah se qualify nahi ho rahi. Missing documents ya income proof complete kijiye."
            return {"summary": summary, "voice_briefing_script": voice}

        joined = ", ".join(eligible_schemes)
        summary = (
            f"{name} qualifies for {len(eligible_schemes)} scheme(s): {joined}. "
            "File the pension or health cover that pays first, then the dependent benefits."
        )
        voice = (
            f"Namaste {name} ji. Aap {len(eligible_schemes)} yojanaon ke liye yogya hain: {joined}. "
            "Pehle pension ya health cover ka form jama kijiye."
        )
        return {"summary": summary, "voice_briefing_script": voice}

    async def build_recommendation(self, citizen: Dict[str, Any], eligible_schemes: List[str]) -> Dict[str, Any]:
        """Return the cross-scheme sequence plus a spoken summary for the field kiosk."""
        age = citizen.get("age", 60)
        sequence = graph_query_engine.generate_roadmap(eligible_schemes, age)
        copy = self._fallback_copy(citizen, eligible_schemes)

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
                    copy["summary"] = ai_summary
            except Exception as e:
                logger.warning(f"LLM recommendation summary failed: {e}")

        return {
            "summary": copy["summary"],
            "voice_briefing_script": copy["voice_briefing_script"],
            "eligible_schemes": eligible_schemes,
            "sequence": sequence,
        }


recommendation_agent = RecommendationAgent()
