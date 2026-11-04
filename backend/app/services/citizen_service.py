from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import DBApplication, DBCitizen, DBEscalation, DBReminder
from app.models.schemas import CitizenCreate

class CitizenService:
    def create_citizen(self, db: Session, citizen_in: CitizenCreate) -> DBCitizen:
        db_citizen = DBCitizen(**citizen_in.model_dump())
        db.add(db_citizen)
        db.commit()
        db.refresh(db_citizen)
        return db_citizen

    def get_citizen(self, db: Session, citizen_id: str) -> Optional[DBCitizen]:
        return db.query(DBCitizen).filter(DBCitizen.id == citizen_id).first()

    def list_citizens(self, db: Session, skip: int = 0, limit: int = 1000) -> List[DBCitizen]:
        return (
            db.query(DBCitizen)
            .order_by(DBCitizen.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def delete_citizen(self, db: Session, citizen_id: str) -> bool:
        citizen = self.get_citizen(db, citizen_id)
        if not citizen:
            return False
        applications = db.query(DBApplication).filter(DBApplication.citizen_id == citizen_id).all()
        application_ids = [row.id for row in applications]
        if application_ids:
            db.query(DBEscalation).filter(DBEscalation.application_id.in_(application_ids)).delete(synchronize_session=False)
            db.query(DBApplication).filter(DBApplication.id.in_(application_ids)).delete(synchronize_session=False)
        db.query(DBReminder).filter(DBReminder.citizen_id == citizen_id).delete(synchronize_session=False)
        db.delete(citizen)
        db.commit()
        return True

citizen_service = CitizenService()
