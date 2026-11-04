import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import declarative_base
from app.models.enums import ApplicationStatus, EscalationReason, NotificationChannel

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False)  # FIELD_WORKER, DISTRICT_ADMIN, SYSTEM_ADMIN
    full_name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

class DBCitizen(Base):
    __tablename__ = "citizens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    monthly_income = Column(Float, nullable=False)
    is_bpl = Column(Boolean, default=True)
    caste_category = Column(String(50), default="General")
    disability_percentage = Column(Float, default=0.0)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    proxy_name = Column(String(150), nullable=True)
    proxy_mobile = Column(String(20), nullable=True)
    has_aadhaar = Column(Boolean, default=True)
    has_bpl_card = Column(Boolean, default=True)
    has_bank_account = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBScheme(Base):
    __tablename__ = "schemes"

    scheme_id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    sponsoring_agency = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    min_age = Column(Integer, default=60)
    max_income = Column(Float, nullable=True)
    prerequisites_json = Column(Text, default="[]")  # JSON string

class DBApplication(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    citizen_id = Column(String(36), nullable=False)
    scheme_id = Column(String(50), nullable=False)
    field_worker_id = Column(String(50), default="FW-101")
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED)
    remarks = Column(Text, nullable=True)
    renewal_due_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBEscalation(Base):
    __tablename__ = "escalations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), nullable=False)
    reason = Column(SQLEnum(EscalationReason), nullable=False)
    description = Column(Text, nullable=False)
    field_worker_id = Column(String(50), nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED, DRAFT_APPEAL_GENERATED
    suggested_ai_resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBReminder(Base):
    __tablename__ = "reminders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    citizen_id = Column(String(36), nullable=False)
    scheme_id = Column(String(50), nullable=False)
    channel = Column(SQLEnum(NotificationChannel), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # AGE_MILESTONE, DOC_EXPIRY, RENEWAL
    scheduled_for = Column(DateTime, nullable=False)
    message = Column(Text, nullable=False)
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
