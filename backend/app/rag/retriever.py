from typing import List
from app.rag.vector_store import vector_store

class SchemeRAGRetriever:
    def retrieve_guidelines(self, scheme_id: str, query: str = "") -> List[str]:
        search_query = f"{scheme_id} {query}".strip()
        results = vector_store.search(search_query, top_k=8)
        citations = []
        for doc in results:
            if doc.get("scheme_id") != scheme_id:
                continue
            label = doc.get("scheme_name") or doc.get("title") or scheme_id
            text = (doc.get("text") or "").strip()
            if text:
                citations.append(f"[{label}] {text}")
        return citations[:3]

rag_retriever = SchemeRAGRetriever()
