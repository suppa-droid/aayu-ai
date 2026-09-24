import logging
import re
from typing import List, Optional

from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)

# llama-3.3-70b-versatile now returns 404 on Groq. These are the chat models
# this project's key can still call, in preference order.
CHAT_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
]

RETIRED_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
}


def _api_key() -> str:
    return (settings.GROQ_API_KEY or "").strip().strip('"').strip("'")


def active_chat_models() -> List[str]:
    """Usable models, skipping a retired name that may still be set in the environment."""
    names: List[str] = []
    for name in [settings.GROQ_MODEL, *CHAT_MODELS]:
        if not name or name in RETIRED_MODELS or name in names:
            continue
        names.append(name)
    return names or list(CHAT_MODELS)


def get_llm(model_name: Optional[str] = None, temperature: float = 0.2):
    key = _api_key()
    if not key or key == "your_api_key_here":
        logger.warning("GROQ_API_KEY is not set. Chat answers will use scheme text only.")
        return None
    model = model_name or active_chat_models()[0]
    return ChatGroq(
        model=model,
        groq_api_key=key,
        temperature=temperature,
    )


def _text_from_response(response) -> str:
    raw = getattr(response, "content", "")
    if isinstance(raw, list):
        parts = []
        for block in raw:
            if isinstance(block, dict):
                parts.append(block.get("text", ""))
            else:
                parts.append(str(block))
        text = "".join(parts)
    else:
        text = str(raw or "")
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


async def generate_text(prompt: str, temperature: float = 0.2) -> Optional[str]:
    """Try each live Groq model. Returns None when every model fails."""
    key = _api_key()
    if not key or key == "your_api_key_here":
        return None

    last_error = None
    for model in active_chat_models():
        try:
            llm = ChatGroq(model=model, groq_api_key=key, temperature=temperature)
            text = _text_from_response(await llm.ainvoke(prompt))
            if text:
                return text
            logger.warning("Groq model %s returned an empty answer", model)
        except Exception as exc:
            last_error = exc
            logger.warning("Groq model %s failed: %s", model, str(exc)[:240])
    if last_error:
        logger.error("All Groq chat models failed: %s", str(last_error)[:300])
    return None
