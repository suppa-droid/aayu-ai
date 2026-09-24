from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.schemas import ApplicationCreate, ApplicationResponse
from app.services.application_service import application_service
from app.services.citizen_service import citizen_service
from app.models.enums import ApplicationStatus
from app.core.security import get_current_user
from app.models.db_models import DBUser

router = APIRouter(prefix="/applications", tags=["Applications"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=ApplicationResponse)
def submit_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    user: DBUser = Depends(get_current_user),
):
    if not citizen_service.get_citizen(db, app_in.citizen_id):
        raise HTTPException(status_code=404, detail="Citizen not found.")
    existing = application_service.find_active(db, app_in.citizen_id, app_in.scheme_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An open {app_in.scheme_id} application already exists ({existing.id}).",
        )
    if not app_in.field_worker_id or app_in.field_worker_id == "FW-101":
        app_in.field_worker_id = user.username
    created = application_service.create_application(db, app_in)
    application_service._attach_names(db, [created])
    return created

@router.get("/", response_model=List[ApplicationResponse])
def list_applications(citizen_id: Optional[str] = None, db: Session = Depends(get_db)):
    return application_service.list_applications(db, citizen_id=citizen_id)

@router.patch("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(app_id: str, status: ApplicationStatus, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    app = application_service.update_status(db, app_id, status, remarks)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return app
