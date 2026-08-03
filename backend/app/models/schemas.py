from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.models.enums import EligibilityStatus, ApplicationStatus, EscalationReason, AdminTier, NotificationChannel

class CitizenBase(BaseModel):
    name: str = Field(..., example="Ramesh Kumar")
    age: int = Field(..., ge=0, le=120, example=67)
    gender: str = Field(..., example="Male")
    monthly_income: float = Field(..., example=2100.0)
    is_bpl: bool = Field(default=True)
    caste_category: str = Field(default="General", example="SC/ST/OBC/General")
    disability_percentage: float = Field(default=0.0)
    state: str = Field(..., example="Uttar Pradesh")
    district: str = Field(..., example="Varanasi")
    mobile_number: str = Field(..., example="9876543210")
    proxy_name: Optional[str] = Field(default=None, example="Suresh Kumar (Son)")
    proxy_mobile: Optional[str] = Field(default=None, example="9876543211")
    has_aadhaar: bool = Field(default=True)
    has_bpl_card: bool = Field(default=True)
    has_bank_account: bool = Field(default=True)

class CitizenCreate(CitizenBase):
    pass

class CitizenResponse(CitizenBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SchemeBase(BaseModel):
    scheme_id: str
    name: str
    category: str
    sponsoring_agency: str
    description: str
    min_age: int
    max_income: Optional[float] = None
    prerequisites: List[str] = []

class SchemeResponse(SchemeBase):
    model_config = ConfigDict(from_attributes=True)

class CounterfactualExplanation(BaseModel):
    missing_criteria: List[str]
    actionable_steps: List[str]
    qualifying_scenarios: List[str]

class EligibilityEvaluationResponse(BaseModel):
    citizen_id: str
    scheme_id: str
    scheme_name: str
    status: EligibilityStatus
    score: float
    matched_criteria: List[str]
    unmatched_criteria: List[str]
    counterfactual: CounterfactualExplanation
    rag_citations: List[str]

class ApplicationCreate(BaseModel):
    citizen_id: str
    scheme_id: str
    field_worker_id: Optional[str] = "FW-101"

class ApplicationResponse(BaseModel):
    id: str
    citizen_id: str
    scheme_id: str
    status: ApplicationStatus
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EscalationCreate(BaseModel):
    application_id: str
    reason: EscalationReason
    description: str
    field_worker_id: str

class EscalationResponse(BaseModel):
    id: str
    application_id: str
    reason: EscalationReason
    description: str
    field_worker_id: str
    status: str
    suggested_ai_resolution: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReminderCreate(BaseModel):
    citizen_id: str
    scheme_id: str
    channel: NotificationChannel
    trigger_type: str
    scheduled_for: datetime
    message: str

class ReminderResponse(ReminderCreate):
    id: str
    is_sent: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
