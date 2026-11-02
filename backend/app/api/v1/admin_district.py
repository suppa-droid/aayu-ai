from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.schemas import EscalationCreate, EscalationResponse
from app.services.escalation_service import escalation_service
from app.core.security import get_current_user
from app.models.db_models import DBUser
from app.api.v1.auth import require_admin

router = APIRouter(prefix="/admin/district", tags=["Level 2 District Admin"])

@router.post("/escalate", response_model=EscalationResponse)
def create_escalation(
    esc_in: EscalationCreate,
    db: Session = Depends(get_db),
    _: DBUser = Depends(get_current_user),
):
    """Create a new escalation ticket. Called by the field kiosk or automated AI checks."""
    return escalation_service.create_escalation(db, esc_in)

@router.get("/escalations", response_model=List[EscalationResponse])
def list_open_escalations(
    status: Optional[str] = "OPEN",
    db: Session = Depends(get_db),
    _: DBUser = Depends(require_admin),
):
    """List open or all escalations for district admin queue."""
    return escalation_service.list_escalations(db, status=status)

class EscalationResolve(BaseModel):
    resolution_notes: Optional[str] = None


@router.post("/escalations/{escalation_id}/resolve")
def resolve_escalation(
    escalation_id: str,
    body: Optional[EscalationResolve] = None,
    resolution_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    _: DBUser = Depends(require_admin),
):
    """Approve and clear an escalation. Notes may arrive as JSON or as a query param."""
    notes = ""
    if body and body.resolution_notes:
        notes = body.resolution_notes
    elif resolution_notes:
        notes = resolution_notes
    res = escalation_service.resolve_escalation(db, escalation_id, notes)
    if not res:
        raise HTTPException(status_code=404, detail="Escalation not found.")
    payload = EscalationResponse.model_validate(res).model_dump(mode="json")
    return {"status": "RESOLVED", "escalation": payload}
