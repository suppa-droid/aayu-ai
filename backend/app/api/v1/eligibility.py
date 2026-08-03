from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.services.citizen_service import citizen_service
from app.agents.orchestrator import orchestrator
from app.agents.eligibility_agent import eligibility_agent
from app.core.security import get_current_user

router = APIRouter(prefix="/eligibility", tags=["Eligibility & Counterfactual Agent"], dependencies=[Depends(get_current_user)])

@router.post("/evaluate-full/{citizen_id}")
async def evaluate_full_citizen_pipeline(citizen_id: str, db: Session = Depends(get_db)):
    """Run the full 8-agent LangGraph pipeline for a citizen."""
    cit = citizen_service.get_citizen(db, citizen_id)
    if not cit:
        raise HTTPException(status_code=404, detail=f"Citizen '{citizen_id}' not found.")
    
    raw_data = {
        "id": cit.id,
        "name": cit.name,
        "age": cit.age,
        "gender": cit.gender,
        "monthly_income": cit.monthly_income,
        "is_bpl": cit.is_bpl,
        "caste_category": cit.caste_category,
        "disability_percentage": cit.disability_percentage,
        "state": cit.state,
        "district": cit.district,
        "mobile_number": cit.mobile_number,
        "has_aadhaar": cit.has_aadhaar,
        "has_bpl_card": cit.has_bpl_card,
        "has_bank_account": cit.has_bank_account
    }

    # Use the async version — safe inside FastAPI's event loop
    return await orchestrator.run_full_pipeline_async(raw_data)

@router.post("/evaluate-scheme/{citizen_id}/{scheme_id}")
def evaluate_single_scheme(citizen_id: str, scheme_id: str, db: Session = Depends(get_db)):
    cit = citizen_service.get_citizen(db, citizen_id)
    if not cit:
        raise HTTPException(status_code=404, detail=f"Citizen '{citizen_id}' not found.")
    
    cit_dict = {
        "id": cit.id,
        "name": cit.name,
        "age": cit.age,
        "gender": cit.gender,
        "monthly_income": cit.monthly_income,
        "is_bpl": cit.is_bpl,
        "caste_category": cit.caste_category,
        "disability_percentage": cit.disability_percentage,
        "state": cit.state,
        "district": cit.district,
        "mobile_number": cit.mobile_number,
        "has_aadhaar": cit.has_aadhaar,
        "has_bpl_card": cit.has_bpl_card,
        "has_bank_account": cit.has_bank_account
    }

    return eligibility_agent.evaluate(cit_dict, scheme_id)
