from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.schemas import EscalationCreate, EscalationResponse
from app.services.escalation_service import escalation_service

router = APIRouter(prefix="/admin/district", tags=["Level 2 District Admin"])

@router.post("/escalate", response_model=EscalationResponse)
def create_escalation(esc_in: EscalationCreate, db: Session = Depends(get_db)):
    """Create a new escalation ticket. Called by the field kiosk or automated AI checks."""
    return escalation_service.create_escalation(db, esc_in)

@router.get("/escalations", response_model=List[EscalationResponse])
def list_open_escalations(status: Optional[str] = "OPEN", db: Session = Depends(get_db)):
    """List open or all escalations for district admin queue."""
    return escalation_service.list_escalations(db, status=status)

@router.post("/escalations/{escalation_id}/resolve")
def resolve_escalation(escalation_id: str, resolution_notes: str = "Verified and resolved by District Admin", db: Session = Depends(get_db)):
    """Resolve an escalation ticket and record resolution notes."""
    res = escalation_service.resolve_escalation(db, escalation_id, resolution_notes)
    if not res:
        raise HTTPException(status_code=404, detail="Escalation not found.")
    return {"status": "RESOLVED", "escalation": res}
