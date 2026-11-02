from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import DBCitizen
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

citizen_service = CitizenService()
