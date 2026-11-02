from typing import List
from sqlalchemy.orm import Session
from app.models.db_models import DBReminder
from app.models.schemas import ReminderCreate

class ReminderSchedulerService:
    def create_reminder(self, db: Session, rem_in: ReminderCreate) -> DBReminder:
        db_rem = DBReminder(**rem_in.model_dump())
        db.add(db_rem)
        db.commit()
        db.refresh(db_rem)
        return db_rem

    def get_reminder(self, db: Session, reminder_id: str):
        return db.query(DBReminder).filter(DBReminder.id == reminder_id).first()

    def get_pending_reminders(self, db: Session) -> List[DBReminder]:
        return db.query(DBReminder).filter(DBReminder.is_sent == False).all()

    def mark_sent(self, db: Session, reminder_id: str) -> DBReminder:
        rem = db.query(DBReminder).filter(DBReminder.id == reminder_id).first()
        if rem:
            rem.is_sent = True
            db.commit()
            db.refresh(rem)
        return rem

reminder_scheduler = ReminderSchedulerService()
