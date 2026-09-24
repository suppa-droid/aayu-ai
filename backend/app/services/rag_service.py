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

from pydantic import BaseModel
from app.core.llm import generate_text

# Import the singleton vector store (populated at startup via ingestion.py)
from app.rag.vector_store import vector_store


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

        answer = await generate_text(prompt, temperature=0.2)
        if not answer:
            # The scheme text was already retrieved. Use it when Groq is down
            # instead of telling the field worker the backend is unreachable.
            excerpts = []
            for chunk in retrieved[:2]:
                text = (chunk.get("text") or "").strip()
                if text:
                    excerpts.append(text)
            answer = "\n\n".join(excerpts)[:900] or "I could not find scheme details for that question."

        return {"answer": answer, "retrieved_chunks": len(retrieved)}


rag_service = RAGService()
