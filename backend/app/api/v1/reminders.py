from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.schemas import ReminderCreate, ReminderResponse
from app.services.reminder_scheduler import reminder_scheduler
from app.services.notification_service import notification_service

router = APIRouter(prefix="/reminders", tags=["Reminders & Planning Triggers"])

@router.post("/", response_model=ReminderResponse)
def schedule_reminder(rem_in: ReminderCreate, db: Session = Depends(get_db)):
    return reminder_scheduler.create_reminder(db, rem_in)

@router.get("/pending", response_model=List[ReminderResponse])
def get_pending_reminders(db: Session = Depends(get_db)):
    return reminder_scheduler.get_pending_reminders(db)

@router.post("/trigger/{reminder_id}")
def trigger_reminder_now(reminder_id: str, db: Session = Depends(get_db)):
    rem = reminder_scheduler.mark_sent(db, reminder_id)
    if rem:
        notification_service.send_notification("9876543210", rem.message, rem.channel)
        return {"status": "SUCCESS", "message": "Notification dispatched."}
    return {"status": "FAILED", "message": "Reminder not found."}
