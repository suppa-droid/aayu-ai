"""
FAISS-powered Vector Store for Aayu AI RAG.
Uses sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings.
Automatically indexes all scheme YAML files from the rules_engine/schemes directory.
"""

import logging
import numpy as np
import yaml
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-transformers model loaded successfully.")
        except ImportError:
            logger.error("sentence-transformers not installed. Run: pip install sentence-transformers faiss-cpu")
            _model = None
    return _model


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


# Cosine on normalized MiniLM vectors. Named scheme questions land around 0.3 and up.
# Unrelated text stays near 0, so a floor stops top-k from filling in other schemes.
MIN_SEMANTIC_SCORE = 0.25

_KEYWORD_STOPWORDS = {
    "the", "and", "for", "are", "you", "what", "how", "can", "this", "that",
    "with", "from", "under", "about", "does", "have", "has", "was", "were",
    "will", "your", "their", "them", "then", "than", "into", "over", "such",
    "any", "all", "not", "but", "who", "why", "when", "where", "which",
    "tell", "please", "could", "would", "should", "there", "here", "also",
}


def _yaml_to_text_chunks(scheme_data: dict) -> List[str]:
    """
    Convert a single YAML scheme definition into rich, human-readable
    text chunks that the LLM can reason over effectively.
    """
    chunks = []
    name = scheme_data.get("name", scheme_data.get("scheme_id", "Unknown Scheme"))
    sid = scheme_data.get("scheme_id", "")
    agency = scheme_data.get("sponsoring_agency", "Government of India")
    category = scheme_data.get("category", "")

    # --- Chunk 1: Overview ---
    chunks.append(
        f"Scheme: {name} ({sid})\n"
        f"Category: {category}\n"
        f"Administered by: {agency}\n"
        f"This scheme provides welfare benefits to eligible Indian senior citizens."
    )

    # --- Chunk 2: Eligibility rules ---
    rules = scheme_data.get("rules", [])
    if rules:
        rules_text = f"Eligibility rules for {name} ({sid}):\n"
        for r in rules:
            rules_text += f"- {r.get('description', '')}\n"
        min_age = scheme_data.get("min_age")
        max_income = scheme_data.get("max_income")
        requires_bpl = scheme_data.get("requires_bpl")
        if min_age:
            rules_text += f"- Minimum age requirement: {min_age} years.\n"
        if max_income:
            rules_text += f"- Maximum monthly household income allowed: Rs. {max_income}.\n"
        if requires_bpl:
            rules_text += "- Applicant must belong to a Below Poverty Line (BPL) household.\n"
        chunks.append(rules_text.strip())

    # --- Chunk 3: Benefits ---
    benefits = scheme_data.get("benefit_details", {})
    if benefits:
        benefit_text = f"Benefits provided under {name} ({sid}):\n"
        for k, v in benefits.items():
            key_label = k.replace("_", " ").title()
            benefit_text += f"- {key_label}: {v}\n"
        chunks.append(benefit_text.strip())

    # --- Chunk 4: Required Documents ---
    docs = scheme_data.get("required_documents", [])
    if docs:
        doc_text = f"Documents required to apply for {name} ({sid}):\n"
        for d in docs:
            doc_text += f"- {d}\n"
        chunks.append(doc_text.strip())

    return chunks


class FAISSVectorStore:
    """
    Full FAISS-backed semantic vector store.
    Falls back to cosine similarity with numpy if faiss-cpu is not installed.
    """

    def __init__(self):
        self.chunks: List[str] = []          # raw text chunks
        self.metadata: List[Dict] = []        # which scheme each chunk belongs to
        self.embeddings: List[np.ndarray] = []
        self._faiss_index = None
        self._indexed = False

    def _build_faiss_index(self):
        if not self.embeddings:
            return
        try:
            import faiss
            dim = self.embeddings[0].shape[0]
            index = faiss.IndexFlatIP(dim)   # Inner Product = cosine on normalized vecs
            matrix = np.array(self.embeddings, dtype=np.float32)
            # Normalize for cosine similarity
            faiss.normalize_L2(matrix)
            index.add(matrix)
            self._faiss_index = index
            logger.info(f"FAISS index built with {index.ntotal} vectors.")
        except ImportError:
            logger.warning("faiss-cpu not available, using numpy cosine fallback.")
            self._faiss_index = None

    def add_documents(self, docs: List[Dict[str, Any]]):
        """Legacy method — kept for compatibility with old ingestion.py"""
        model = _get_model()
        for doc in docs:
            text = doc.get("text", "")
            embedding = model.encode(text, convert_to_numpy=True) if model else np.zeros(384)
            self.chunks.append(text)
            self.metadata.append({"scheme_id": doc.get("scheme_id", ""), "title": doc.get("title", "")})
            self.embeddings.append(embedding)
        self._build_faiss_index()

    def ingest_yaml_directory(self, schemes_dir: Path, embed: bool = True):
        """
        Main ingestion pipeline: reads all YAML files in a directory,
        converts them to rich text chunks, embeds them, and builds the FAISS index.

        embed=False loads scheme text only so the API can bind immediately.
        Keyword search works until embeddings finish in the background.
        """
        yaml_files = list(schemes_dir.glob("*.yaml")) + list(schemes_dir.glob("*.yml"))
        if not yaml_files:
            logger.warning(f"No YAML scheme files found in {schemes_dir}")
            return

        logger.info(f"Ingesting {len(yaml_files)} scheme files from {schemes_dir}")

        all_chunks = []
        all_meta = []

        for fpath in yaml_files:
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                if not data:
                    continue
                scheme_id = data.get("scheme_id", fpath.stem)
                scheme_name = data.get("name", scheme_id)
                chunks = _yaml_to_text_chunks(data)
                for chunk in chunks:
                    all_chunks.append(chunk)
                    all_meta.append({"scheme_id": scheme_id, "scheme_name": scheme_name, "source_file": fpath.name})
                logger.info(f"  Ingested {len(chunks)} chunks from {fpath.name}")
            except Exception as e:
                logger.error(f"Failed to ingest {fpath}: {e}")

        if not all_chunks:
            return

        self.chunks = all_chunks
        self.metadata = all_meta
        if not embed:
            logger.info(
                f"Scheme text loaded ({len(self.chunks)} chunks). FAISS embeddings will follow in the background."
            )
            return

        model = _get_model()
        if model is None:
            self.embeddings = []
            self._faiss_index = None
            logger.warning("Scheme text loaded without embeddings. Ask Aayu will use keyword overlap.")
            return

        # Batch encode for speed
        logger.info(f"Embedding {len(all_chunks)} chunks with sentence-transformers...")
        embeddings = model.encode(all_chunks, convert_to_numpy=True, show_progress_bar=False)

        self.embeddings = list(embeddings)
        self._build_faiss_index()
        self._indexed = True
        logger.info(f"RAG Knowledge Base ready: {len(self.chunks)} chunks indexed.")

    def _embeddings_ready(self) -> bool:
        return bool(self.embeddings) and len(self.embeddings) == len(self.chunks)

    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Overlap search used until FAISS embeddings exist, and for tests."""
        import re
        terms = [
            t for t in re.findall(r"[a-z0-9]+", (query or "").lower())
            if len(t) > 2 and t not in _KEYWORD_STOPWORDS
        ]
        if not terms:
            return []
        scored = []
        for i, chunk in enumerate(self.chunks):
            hay = chunk.lower()
            score = sum(1 for term in terms if term in hay)
            if score > 0:
                scored.append((score, i))
        scored.sort(reverse=True)
        return [
            {"text": self.chunks[idx], "score": float(score), **self.metadata[idx]}
            for score, idx in scored[:top_k]
        ]

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Semantically search the index and return the top-k most relevant chunks.
        Chunks below the cosine floor are omitted so an unrelated question
        does not come back with some other scheme's text.
        """
        if not self.chunks:
            return []

        # Embeddings load on a background thread. Do not block the request
        # on sentence-transformers, and do not run cosine against a short vector list.
        if not self._embeddings_ready():
            return self._keyword_search(query, top_k)

        model = _get_model()
        if model is None:
            return self._keyword_search(query, top_k)

        query_embedding = model.encode(query, convert_to_numpy=True).astype(np.float32)

        results = []

        if self._faiss_index is not None and getattr(self._faiss_index, "ntotal", 0) == len(self.chunks):
            import faiss
            q = query_embedding.reshape(1, -1)
            faiss.normalize_L2(q)
            scores, indices = self._faiss_index.search(q, min(top_k, len(self.chunks)))
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and float(score) >= MIN_SEMANTIC_SCORE:
                    results.append({
                        "text": self.chunks[idx],
                        "score": float(score),
                        **self.metadata[idx]
                    })
        else:
            scored = []
            for i, emb in enumerate(self.embeddings):
                score = _cosine_similarity(query_embedding, emb)
                if score >= MIN_SEMANTIC_SCORE:
                    scored.append((score, i))
            scored.sort(reverse=True)
            for score, idx in scored[:top_k]:
                results.append({
                    "text": self.chunks[idx],
                    "score": float(score),
                    **self.metadata[idx]
                })

        return results


# Singleton — loaded once at startup
vector_store = FAISSVectorStore()
