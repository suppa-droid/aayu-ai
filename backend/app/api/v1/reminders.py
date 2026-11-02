from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.db_models import DBCitizen
from app.models.schemas import ReminderCreate, ReminderResponse
from app.services.reminder_scheduler import reminder_scheduler
from app.services.notification_service import notification_service
from app.services.citizen_service import citizen_service
from app.core.security import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders & Planning Triggers"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ReminderResponse)
def schedule_reminder(rem_in: ReminderCreate, db: Session = Depends(get_db)):
    if not citizen_service.get_citizen(db, rem_in.citizen_id):
        raise HTTPException(status_code=404, detail=f"Citizen '{rem_in.citizen_id}' not found.")
    return reminder_scheduler.create_reminder(db, rem_in)

@router.get("/pending", response_model=List[ReminderResponse])
def get_pending_reminders(db: Session = Depends(get_db)):
    return reminder_scheduler.get_pending_reminders(db)

@router.post("/trigger/{reminder_id}")
def trigger_reminder_now(reminder_id: str, db: Session = Depends(get_db)):
    rem = reminder_scheduler.get_reminder(db, reminder_id)
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    if rem.is_sent:
        return {"status": "FAILED", "message": "This reminder was already sent."}

    citizen = db.query(DBCitizen).filter(DBCitizen.id == rem.citizen_id).first()
    phone = ""
    citizen_name = "Citizen"
    if citizen:
        phone = (citizen.proxy_mobile or citizen.mobile_number or "").strip()
        citizen_name = citizen.name or citizen_name
    if not phone:
        return {"status": "FAILED", "message": "No mobile number is saved for this citizen."}

    delivered = notification_service.send_notification(phone, rem.message, rem.channel, citizen_name=citizen_name)
    if not delivered:
        return {"status": "FAILED", "message": "Notification could not be delivered. The reminder is still pending."}

    reminder_scheduler.mark_sent(db, reminder_id)
    return {"status": "SUCCESS", "message": f"Notification dispatched to {phone}."}
