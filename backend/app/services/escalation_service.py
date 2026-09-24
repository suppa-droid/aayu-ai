from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import DBEscalation, DBApplication
from app.models.schemas import EscalationCreate
from app.models.enums import ApplicationStatus

class EscalationService:
    def create_escalation(self, db: Session, esc_in: EscalationCreate) -> DBEscalation:
        # Generate AI Suggested Draft Appeal
        suggested_resolution = (
            f"AI Escalation Assistant Draft: Flagged due to '{esc_in.reason.value}'. "
            f"Field worker note: '{esc_in.description}'. "
            f"Recommendation for Level 2 District Admin: Verify Aadhaar demographic update or request BPL Tehsildar endorsement."
        )

        db_esc = DBEscalation(
            application_id=esc_in.application_id,
            reason=esc_in.reason,
            description=esc_in.description,
            field_worker_id=esc_in.field_worker_id,
            status="OPEN",
            suggested_ai_resolution=suggested_resolution
        )
        db.add(db_esc)
        
        # Update application status to ESCALATED_DISTRICT (if application exists)
        if esc_in.application_id and esc_in.application_id != "00000000-0000-0000-0000-000000000001":
            app = db.query(DBApplication).filter(DBApplication.id == esc_in.application_id).first()
            if app:
                app.status = ApplicationStatus.ESCALATED_DISTRICT
            
        db.commit()
        db.refresh(db_esc)
        return db_esc

    def list_escalations(self, db: Session, status: Optional[str] = "OPEN") -> List[DBEscalation]:
        query = db.query(DBEscalation)
        if status and status.upper() != "ALL":
            query = query.filter(DBEscalation.status == status)
        return query.order_by(DBEscalation.created_at.desc()).all()

    def resolve_escalation(self, db: Session, escalation_id: str, resolution_notes: str) -> DBEscalation:
        esc = db.query(DBEscalation).filter(DBEscalation.id == escalation_id).first()
        if esc:
            esc.status = "RESOLVED"
            esc.suggested_ai_resolution = f"Resolved by District Admin: {resolution_notes}"
            app = db.query(DBApplication).filter(DBApplication.id == esc.application_id).first()
            if app and app.status == ApplicationStatus.ESCALATED_DISTRICT:
                app.status = ApplicationStatus.DOCUMENT_VERIFIED
            db.commit()
            db.refresh(esc)
        return esc

escalation_service = EscalationService()
