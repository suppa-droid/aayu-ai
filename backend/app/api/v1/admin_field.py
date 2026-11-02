from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.agents.document_verification_agent import document_verification_agent
from app.core.security import get_current_user
from app.models.db_models import DBUser
from app.models.enums import EscalationReason
from app.models.schemas import EscalationCreate
from app.services.escalation_service import escalation_service

router = APIRouter(prefix="/admin/field", tags=["Level 1 Field Admin"])

# Document-only checks have no application row yet. The district queue still
# needs a stable id so the ticket can be stored and listed.
DOCUMENT_ONLY_APPLICATION_ID = "00000000-0000-0000-0000-000000000001"

REASON_BY_STATUS = {
    "FLAGGED_MISMATCH": EscalationReason.NAME_MISMATCH,
    "FLAGGED_QUALITY": EscalationReason.DOCUMENT_DAMAGED,
    "FRAUD_ALERT": EscalationReason.DOCUMENT_DAMAGED,
    "VISION_AI_UNAVAILABLE": EscalationReason.SYSTEM_PIPELINE_ERROR,
}


def queue_document_escalation(
    db: Session,
    result: dict,
    document_type: str,
    citizen_name: str,
    username: str,
) -> Optional[str]:
    """Open a district ticket for every scan that the field kiosk must escalate."""
    if not result.get("escalate_level"):
        return None
    reason = REASON_BY_STATUS.get(result.get("status"), EscalationReason.SYSTEM_PIPELINE_ERROR)
    finding = result.get("issue") or result.get("status") or "Document check needs review"
    created = escalation_service.create_escalation(
        db,
        EscalationCreate(
            application_id=DOCUMENT_ONLY_APPLICATION_ID,
            reason=reason,
            description=(
                f'[Document Verification] Citizen: "{citizen_name}" | Doc: {document_type} '
                f"| Officer: {username} | AI finding: {finding}"
            ),
            field_worker_id=username or "field_worker",
        ),
    )
    return created.id


@router.post("/verify-document")
async def verify_document_upload(
    document_type: str = Form(...),
    citizen_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: DBUser = Depends(get_current_user),
):
    """Real OCR Document Verification Agent for Anganwadi / Field Staff tablet interface."""
    result = await document_verification_agent.verify_document_async(
        document_type=document_type,
        citizen_name=citizen_name,
        file=file,
    )
    ticket_id = queue_document_escalation(db, result, document_type, citizen_name, user.username)
    if ticket_id:
        result = {**result, "escalation_id": ticket_id, "escalation_status": "OPEN"}
    return result
