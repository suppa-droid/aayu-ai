from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.schemas import ApplicationCreate, ApplicationResponse
from app.services.application_service import application_service
from app.models.enums import ApplicationStatus

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/", response_model=ApplicationResponse)
def submit_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    return application_service.create_application(db, app_in)

@router.get("/", response_model=List[ApplicationResponse])
def list_applications(citizen_id: Optional[str] = None, db: Session = Depends(get_db)):
    return application_service.list_applications(db, citizen_id=citizen_id)

@router.patch("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(app_id: str, status: ApplicationStatus, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    app = application_service.update_status(db, app_id, status, remarks)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return app
