"""
Aayu AI RAG Service
===================
Proper Retrieval-Augmented Generation using FAISS semantic search.

Flow:
  1. User submits a question.
  2. The question is embedded with sentence-transformers.
  3. FAISS finds the top-k most semantically similar knowledge chunks.
  4. Retrieved chunks are injected into the LLM prompt as grounded context.
  5. Groq (Llama-3.3-70b) generates an accurate, grounded answer.
"""

import re
import logging
from pydantic import BaseModel
from app.core.llm import get_llm

# Import the singleton vector store (populated at startup via ingestion.py)
from app.rag.vector_store import vector_store

logger = logging.getLogger(__name__)


class RAGRequest(BaseModel):
    query: str


class RAGResponse(BaseModel):
    answer: str
    retrieved_chunks: int = 0


class RAGService:
    async def ask_question(self, query: str) -> dict:
        # ── Step 1: Retrieve relevant chunks via FAISS semantic search ──
        retrieved = vector_store.search(query, top_k=4)

        if not retrieved:
            return {
                "answer": "I'm sorry, the Aayu AI knowledge base hasn't been indexed yet. Please restart the backend server.",
                "retrieved_chunks": 0
            }

        # ── Step 2: Build grounded context from retrieved chunks ──
        context_block = ""
        for i, chunk in enumerate(retrieved, 1):
            score_str = f" (relevance: {chunk.get('score', 0):.2f})" if "score" in chunk else ""
            context_block += f"[Source {i} — {chunk.get('scheme_name', 'Welfare Scheme')}{score_str}]\n{chunk['text']}\n\n"

        # ── Step 3: Augment prompt ──
        prompt = f"""You are Aayu AI, a highly knowledgeable and empathetic virtual assistant for government field workers helping senior citizens access welfare schemes in India.

You have retrieved the following relevant information from your official knowledge base to answer the user's question.

RETRIEVED KNOWLEDGE (use ONLY this to answer):
{context_block}

USER QUESTION:
{query}

Instructions:
- Answer clearly and concisely based ONLY on the retrieved knowledge above.
- If the retrieved knowledge does not have enough information, say so honestly.
- If the question involves eligibility, state the exact criteria.
- If the question involves benefits, state exact amounts/details.
- Do not mention "retrieved chunks", "YAML", or internal system details.
- Keep the answer professional, empathetic, and under 4 sentences.
"""

        # ── Step 4: Generate with Groq LLM ──
        llm = get_llm(temperature=0.2)
        if not llm:
            return {"answer": "Error: LLM backend is currently unavailable.", "retrieved_chunks": len(retrieved)}

        try:
            response = await llm.ainvoke(prompt)
            raw = response.content
            if isinstance(raw, list):
                parts = [block.get("text", "") if isinstance(block, dict) else str(block) for block in raw]
                answer = "".join(parts).strip()
            else:
                answer = str(raw).strip()

            # Clean any model thinking tags
            answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()

            return {"answer": answer, "retrieved_chunks": len(retrieved)}

        except Exception as e:
            logger.error(f"RAG LLM error: {e}")
            return {
                "answer": "Sorry, I'm having trouble connecting to the Aayu AI backend right now. Please try again.",
                "retrieved_chunks": len(retrieved)
            }


rag_service = RAGService()
