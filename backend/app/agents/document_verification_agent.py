import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger(__name__)

# gemini-2.0-flash and gemini-2.5-flash return 404 for current keys.
# gemini-3.6-flash is the vision model this key can call; lite is the fallback.
VISION_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"]


def _clean_key(value: str) -> str:
    return (value or "").strip().strip('"').strip("'")


def _norm_tokens(value: str) -> List[str]:
    return [tok for tok in re.sub(r"[^a-z\s]", " ", (value or "").lower()).split() if len(tok) > 1]


def names_match(profile_name: str, extracted_name: str) -> bool:
    """Fuzzy match that ignores case, punctuation, and extra middle names."""
    profile = _norm_tokens(profile_name)
    extracted = _norm_tokens(extracted_name)
    if not profile or not extracted:
        return False
    return set(profile).issubset(set(extracted)) or set(extracted).issubset(set(profile))


class DocumentVerificationAgent:
    """Verifies uploaded documents with Gemini vision OCR."""

    @property
    def GOOGLE_API_KEY(self) -> str:
        # Settings loads backend/.env. os.environ alone misses that file,
        # which forced every local scan into simulation mode.
        return _clean_key(settings.GOOGLE_API_KEY) or _clean_key(os.environ.get("GOOGLE_API_KEY", ""))

    def _smart_simulation(
        self,
        document_type: str,
        citizen_name: str,
        file_name: str,
        image_bytes: bytes,
    ) -> Dict[str, Any]:
        """Deterministic results for the three labelled demo samples only."""
        fn = (file_name or "").lower()

        if "blur" in fn or "low" in fn:
            return {
                "is_valid": False,
                "status": "FLAGGED_QUALITY",
                "issue": f"{document_type} image appears blurry or unreadable.",
                "escalate_level": 1,
                "action": "Field Worker must recapture a clear document photo.",
                "extracted_name": "Unreadable",
                "document_number": "N/A",
                "source": "demo",
            }

        if "mismatch" in fn or "wrong" in fn or "other" in fn:
            fake_name = "Suresh Kumar" if "ramesh" in citizen_name.lower() else "Anil Sharma"
            return {
                "is_valid": False,
                "status": "FLAGGED_MISMATCH",
                "issue": f"Name mismatch: Profile '{citizen_name}' vs Document '{fake_name}'.",
                "escalate_level": 2,
                "action": "Escalated to Level 2 District Admin for name-correction affidavit.",
                "extracted_name": fake_name,
                "document_number": "7829-1092-4410",
                "source": "demo",
            }

        if "matching" in fn:
            doc_number = "4729-1038-9921" if "aadhaar" in document_type.lower() else "RC-MH-2024-00142"
            return {
                "is_valid": True,
                "status": "VERIFIED",
                "issue": None,
                "escalate_level": None,
                "action": f"Demo sample accepted. Extracted Name: '{citizen_name}' matches profile.",
                "extracted_name": citizen_name,
                "document_number": doc_number,
                "source": "demo",
            }

        # A real upload must not be auto-approved when vision is down.
        return {
            "is_valid": False,
            "status": "VISION_AI_UNAVAILABLE",
            "issue": "Gemini Vision could not read this image, so it was not auto-approved.",
            "escalate_level": 2,
            "action": "Escalated for manual district review. Retry the scan when vision responds.",
            "extracted_name": "N/A",
            "document_number": "N/A",
            "source": "fallback",
            "_bytes": len(image_bytes),
        }

    def _is_demo_sample(self, file_name: str) -> bool:
        fn = (file_name or "").lower()
        return any(token in fn for token in ("matching_aadhaar", "name_mismatch", "blurry_image"))

    def _interpret(self, ai_data: Dict[str, Any], document_type: str, citizen_name: str, model: str) -> Dict[str, Any]:
        extracted = str(ai_data.get("extracted_name") or "").strip() or "Unknown"
        number = str(ai_data.get("document_number") or "N/A")

        if ai_data.get("is_blurry"):
            return {
                "is_valid": False,
                "status": "FLAGGED_QUALITY",
                "issue": f"{document_type} image is blurry or unreadable.",
                "escalate_level": 1,
                "action": "Field Worker must recapture a clear document photo.",
                "extracted_name": extracted,
                "document_number": number,
                "source": model,
            }

        if extracted == "NOT_A_VALID_DOCUMENT" or ai_data.get("is_official_document") is False:
            return {
                "is_valid": False,
                "status": "FRAUD_ALERT",
                "issue": "Uploaded image is not a valid government identity document.",
                "escalate_level": 2,
                "action": "Escalated to Level 2 District Admin — possible document fraud attempt.",
                "extracted_name": "N/A",
                "document_number": number,
                "source": model,
            }

        matched = names_match(citizen_name, extracted)
        if not matched:
            return {
                "is_valid": False,
                "status": "FLAGGED_MISMATCH",
                "issue": f"Name mismatch: Profile '{citizen_name}' vs Document '{extracted}'.",
                "escalate_level": 2,
                "action": "Escalated to Level 2 District Admin for name-correction affidavit.",
                "extracted_name": extracted,
                "document_number": number,
                "source": model,
            }

        return {
            "is_valid": True,
            "status": "VERIFIED",
            "issue": None,
            "escalate_level": None,
            "action": f"Document verified via Gemini ({model}). Extracted Name: '{extracted}' matches profile.",
            "extracted_name": extracted,
            "document_number": number,
            "source": model,
        }

    def _call_gemini(self, api_key: str, prompt: str, image_data: bytes, mime_type: str) -> Optional[Dict[str, Any]]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        image_part = types.Part.from_bytes(data=image_data, mime_type=mime_type)
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0,
        )
        last_error = None
        for model in VISION_MODELS:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[prompt, image_part],
                    config=config,
                )
                raw = (getattr(response, "text", None) or "").strip()
                if not raw:
                    raise ValueError("empty vision response")
                return {"model": model, "data": json.loads(raw)}
            except Exception as exc:
                last_error = exc
                message = str(exc)
                logger.warning("Gemini model %s failed: %s", model, message[:240])
                # Auth and quota failures will not be fixed by another model name.
                if any(token in message for token in ("API_KEY_INVALID", "401", "403", "429", "RESOURCE_EXHAUSTED")):
                    break
        if last_error:
            logger.error("Gemini vision unavailable: %s", str(last_error)[:300])
        return None

    async def verify_document_async(
        self,
        document_type: str,
        citizen_name: str,
        file: UploadFile,
    ) -> Dict[str, Any]:
        image_data = await file.read()
        file_name = file.filename or "uploaded_doc.jpg"

        if self._is_demo_sample(file_name):
            return self._smart_simulation(document_type, citizen_name, file_name, image_data)

        if len(image_data) < 800:
            return {
                "is_valid": False,
                "status": "FLAGGED_QUALITY",
                "issue": f"{document_type} image is too small to read.",
                "escalate_level": 1,
                "action": "Field Worker must recapture a clear document photo.",
                "extracted_name": "Unreadable",
                "document_number": "N/A",
                "source": "quality-check",
            }

        api_key = self.GOOGLE_API_KEY
        if not api_key:
            logger.warning("GOOGLE_API_KEY not set — refusing to auto-approve.")
            return self._smart_simulation(document_type, citizen_name, file_name, image_data)

        mime_type = (
            file.content_type
            if file.content_type and file.content_type.startswith("image/")
            else "image/jpeg"
        )
        prompt = f"""You are a strict document verification agent for an Indian welfare portal.
The uploaded image is supposed to be a '{document_type}'.
The citizen profile name is '{citizen_name}'.

Return JSON with exactly these fields:
{{
  "is_blurry": false,
  "is_official_document": true,
  "extracted_name": "name printed on the document, or NOT_A_VALID_DOCUMENT",
  "document_number": "id number or N/A"
}}

Rules:
- is_blurry is true only when the text cannot be read.
- is_official_document is false for selfies, random objects, and non-government images. Then extracted_name must be NOT_A_VALID_DOCUMENT.
- Copy the name exactly as printed. Do not copy the profile name unless it is actually printed.
"""

        import asyncio
        parsed = await asyncio.to_thread(self._call_gemini, api_key, prompt, image_data, mime_type)
        if not parsed:
            return self._smart_simulation(document_type, citizen_name, file_name, image_data)
        return self._interpret(parsed["data"], document_type, citizen_name, parsed["model"])


document_verification_agent = DocumentVerificationAgent()
