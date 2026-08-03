"""
Startup ingestion: called once when the backend boots.
Loads all YAML scheme files into the FAISS vector store.
"""
from pathlib import Path
from app.rag.vector_store import vector_store

SCHEMES_DIR = Path(__file__).parent.parent / "rules_engine" / "schemes"

def seed_scheme_documents():
    """Ingest all YAML scheme files into the FAISS semantic vector store."""
    vector_store.ingest_yaml_directory(SCHEMES_DIR)

seed_scheme_documents()
