from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any
from app.db.session import get_db
from app.agents.document_verification_agent import document_verification_agent
from app.core.security import get_current_user

router = APIRouter(prefix="/admin/field", tags=["Level 1 Field Admin"])

@router.post("/verify-document")
async def verify_document_upload(
    document_type: str = Form(...),
    citizen_name: str = Form(...),
    file: UploadFile = File(...)
):
    """Real OCR Document Verification Agent for Anganwadi / Field Staff tablet interface."""
    return await document_verification_agent.verify_document_async(
        document_type=document_type,
        citizen_name=citizen_name,
        file=file
    )
