from langchain_groq import ChatGroq
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_llm(model_name="llama-3.3-70b-versatile", temperature=0.2):
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_api_key_here":
        logger.warning("GROQ_API_KEY is not properly set in .env. LLM calls will fail.")
        return None
    
    return ChatGroq(
        model=model_name,
        groq_api_key=settings.GROQ_API_KEY,
        temperature=temperature
    )
