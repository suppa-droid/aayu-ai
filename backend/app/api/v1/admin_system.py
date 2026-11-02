import time
import sys
import os
import psutil
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.rules_engine.rule_loader import rule_loader
from app.config import settings
from app.core.llm import active_chat_models
from app.models.db_models import DBCitizen, DBApplication, DBEscalation, DBReminder, DBUser, DBScheme
from app.models.enums import ApplicationStatus
from app.api.v1.auth import require_admin

router = APIRouter(
    prefix="/admin/system",
    tags=["Level 3 System Admin"],
    dependencies=[Depends(require_admin)],
)

START_TIME = time.time()

def _rag_available() -> bool:
    try:
        import sentence_transformers  # noqa: F401
        return True
    except Exception:
        return False

@router.get("/pipeline-health")
def get_pipeline_health(db: Session = Depends(get_db)):
    now = time.time()
    uptime_seconds = int(now - START_TIME)
    
    # 1. Real Database Diagnostics & Latency
    db_status = "CONNECTED"
    db_latency_ms = 0.0
    try:
        t0 = time.perf_counter()
        db.execute(text("SELECT 1")).scalar()
        db_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        
        citizen_count = db.query(DBCitizen).count()
        app_count = db.query(DBApplication).count()
        escalation_count = db.query(DBEscalation).count()
        reminder_count = db.query(DBReminder).count()
        user_count = db.query(DBUser).count()
        scheme_db_count = db.query(DBScheme).count()
    except Exception as e:
        db_status = f"ERROR: {str(e)}"
        citizen_count = app_count = escalation_count = reminder_count = user_count = scheme_db_count = 0

    # 2. System Hardware / Resource Telemetry
    process = psutil.Process(os.getpid())
    process_memory_mb = round(process.memory_info().rss / (1024 * 1024), 2)
    sys_memory = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=0.1)

    # 3. Rules Engine Status
    loaded_schemes = list(rule_loader.schemes_cache.keys())
    rules_count = len(loaded_schemes)

    # 4. LLM & Inference Engine Status
    has_groq_key = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5)
    has_google_key = bool(settings.GOOGLE_API_KEY and len(settings.GOOGLE_API_KEY.strip()) > 5)
    
    # Seven agent modules live under app/agents. The orchestrator is the
    # runner, not an eighth agent. Eligibility calls four of them in order.
    pipeline_steps = [
        "ProfilingAgent",
        "EligibilityAgent",
        "RecommendationAgent",
        "PlanningAgent",
    ]
    agents_status = [
        {
            "id": "profiling_agent",
            "name": "ProfilingAgent",
            "status": "HEALTHY",
            "role": "Normalizes the citizen profile before the rules run",
            "engine": "In-memory profile",
        },
        {
            "id": "eligibility_agent",
            "name": "EligibilityAgent",
            "status": "HEALTHY" if rules_count > 0 else "DEGRADED",
            "role": f"Runs the YAML rules for every loaded scheme ({rules_count} loaded)",
            "engine": "Deterministic rules engine",
        },
        {
            "id": "explainability_agent",
            "name": "ExplainabilityAgent",
            "status": "HEALTHY",
            "role": "Explains which rule failed and what would unlock the scheme",
            "engine": "Deterministic counterfactuals",
        },
        {
            "id": "recommendation_agent",
            "name": "RecommendationAgent",
            "status": "HEALTHY" if has_groq_key else "STANDBY",
            "role": "Writes the spoken summary for schemes that fully qualify",
            "engine": f"Groq ({active_chat_models()[0]}) with a local fallback",
        },
        {
            "id": "planning_agent",
            "name": "PlanningAgent",
            "status": "HEALTHY",
            "role": "Builds the filing steps and age-milestone reminders",
            "engine": "Roadmap builder",
        },
        {
            "id": "document_verification_agent",
            "name": "DocumentVerificationAgent",
            "status": "HEALTHY" if has_google_key else "STANDBY",
            "role": "Reads an uploaded document with Gemini and opens a district ticket when it fails",
            "engine": "Gemini 3.6 Flash, then Gemini 3.5 Flash Lite",
        },
        {
            "id": "reminder_agent",
            "name": "ReminderAgent",
            "status": "HEALTHY",
            "role": "Formats WhatsApp and voice reminders for a saved mobile number",
            "engine": "Message formatter",
        },
    ]

    return {
        "status": "HEALTHY" if db_status == "CONNECTED" else "DEGRADED",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": uptime_seconds,
        "runtime": {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "pid": os.getpid(),
            "process_memory_mb": process_memory_mb,
            "system_memory_used_mb": round((sys_memory.total - sys_memory.available) / (1024 * 1024), 2),
            "system_memory_total_mb": round(sys_memory.total / (1024 * 1024), 2),
            "system_memory_percent": sys_memory.percent,
            "cpu_percent": cpu_percent
        },
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
            "records": {
                "citizens": citizen_count,
                "applications": app_count,
                "escalations": escalation_count,
                "reminders": reminder_count,
                "users": user_count,
                "schemes": scheme_db_count
            }
        },
        "rules_engine": {
            "status": "HEALTHY" if rules_count > 0 else "EMPTY",
            "rules_loaded": rules_count,
            "schemes": loaded_schemes
        },
        "llm_inference": {
            "provider": "Groq LPU Cloud",
            "model": active_chat_models()[0],
            "status": "ONLINE" if has_groq_key else "STANDBY (KEY_NOT_CONFIGURED)"
        },
        "rag_vector_store": {
            "status": "ONLINE" if _rag_available() else "STANDBY",
            "embedding_model": "all-MiniLM-L6-v2",
            "storage_path": settings.VECTOR_STORE_PATH
        },
        "active_agents": [agent["name"] for agent in agents_status],
        "pipeline_steps": pipeline_steps,
        "agents_telemetry": agents_status
    }

@router.get("/rules")
def list_system_rules():
    return rule_loader.list_schemes()

@router.get("/analytics")
def get_live_analytics(db: Session = Depends(get_db)):
    """District counts from the live database, not sample figures."""
    citizens = db.query(DBCitizen).all()
    applications = db.query(DBApplication).all()
    escalations = db.query(DBEscalation).all()

    active_ids = {
        app.citizen_id
        for app in applications
        if app.status != ApplicationStatus.REJECTED
    }
    approved_count = sum(1 for app in applications if app.status == ApplicationStatus.APPROVED)
    open_escalations = sum(1 for esc in escalations if esc.status == "OPEN")

    citizen_district = {c.id: (c.district or "Unknown") for c in citizens}
    buckets: dict = {}
    for citizen in citizens:
        district = citizen.district or "Unknown"
        bucket = buckets.setdefault(district, {
            "district": district,
            "onboarded": 0,
            "enrolled": 0,
            "escalations": 0,
        })
        bucket["onboarded"] += 1
        if citizen.id in active_ids:
            bucket["enrolled"] += 1

    for esc in escalations:
        app = next((a for a in applications if a.id == esc.application_id), None)
        if not app:
            continue
        district = citizen_district.get(app.citizen_id)
        if district and district in buckets:
            buckets[district]["escalations"] += 1

    districts = []
    for bucket in buckets.values():
        bucket["rate"] = round(100.0 * bucket["enrolled"] / bucket["onboarded"], 1) if bucket["onboarded"] else 0
        districts.append(bucket)
    districts.sort(key=lambda row: row["onboarded"], reverse=True)

    return {
        "total_citizens": len(citizens),
        "approved_applications": approved_count,
        "open_escalations": open_escalations,
        "total_applications": len(applications),
        "districts": districts,
    }
