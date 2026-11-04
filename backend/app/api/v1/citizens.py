from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.schemas import CitizenCreate, CitizenResponse
from app.services.citizen_service import citizen_service
from app.core.security import get_current_user

router = APIRouter(prefix="/citizens", tags=["Citizens"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=CitizenResponse)
def register_citizen(citizen_in: CitizenCreate, db: Session = Depends(get_db)):
    return citizen_service.create_citizen(db, citizen_in)

@router.get("/", response_model=List[CitizenResponse])
def list_citizens(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return citizen_service.list_citizens(db, skip=skip, limit=limit)

@router.delete("/{citizen_id}")
def delete_citizen(citizen_id: str, db: Session = Depends(get_db)):
    """A field worker can remove a citizen they registered, including that person's filings."""
    if not citizen_service.delete_citizen(db, citizen_id):
        raise HTTPException(status_code=404, detail=f"Citizen '{citizen_id}' not found.")
    return {"status": "DELETED", "id": citizen_id}

@router.get("/{citizen_id}", response_model=CitizenResponse)
def get_citizen(citizen_id: str, db: Session = Depends(get_db)):
    cit = citizen_service.get_citizen(db, citizen_id)
    if not cit:
        raise HTTPException(status_code=404, detail=f"Citizen '{citizen_id}' not found.")
    return cit
