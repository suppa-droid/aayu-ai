from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.rag_service import rag_service, RAGRequest, RAGResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/ask", tags=["Ask Aayu AI RAG"], dependencies=[Depends(get_current_user)])

@router.post("", response_model=RAGResponse)
async def ask_aayu_ai(req: RAGRequest, db: Session = Depends(get_db)):
    """
    Full RAG endpoint: FAISS semantic retrieval + Groq LLM generation.
    Answers any question grounded in the indexed scheme knowledge base.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        result = await rag_service.ask_question(req.query)
        return RAGResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
