from typing import List, Dict, Any
from app.rag.vector_store import vector_store

class SchemeRAGRetriever:
    def retrieve_guidelines(self, scheme_id: str, query: str = "") -> List[str]:
        search_query = f"{scheme_id} {query}"
        results = vector_store.search(search_query, top_k=3)
        citations = []
        for doc in results:
            # Use 'scheme_name' (set by ingest_yaml_directory) or fall back to 'title' / scheme_id
            label = doc.get("scheme_name") or doc.get("title") or doc.get("scheme_id", "Scheme")
            text  = doc.get("text", "")
            if doc.get("scheme_id") == scheme_id or not query:
                citations.append(f"[{label}] {text}")
        if not citations and results:
            doc = results[0]
            label = doc.get("scheme_name") or doc.get("title") or doc.get("scheme_id", "Scheme")
            citations.append(f"[{label}] {doc.get('text', '')}")
        return citations

rag_retriever = SchemeRAGRetriever()
