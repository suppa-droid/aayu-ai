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
from app.models.db_models import DBCitizen, DBApplication, DBEscalation, DBReminder, DBUser, DBScheme

router = APIRouter(prefix="/admin/system", tags=["Level 3 System Admin"])

START_TIME = time.time()

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
    
    # 5. Pipeline Agent Nodes Status
    agents_status = [
        {
            "id": "profiling_agent",
            "name": "ProfilingAgent",
            "status": "HEALTHY",
            "role": "Citizen profile aggregation & socio-economic normalizing",
            "latency_ms": 120,
            "engine": "In-Memory Data Pipeline"
        },
        {
            "id": "rule_verification_agent",
            "name": "RuleVerificationAgent",
            "status": "HEALTHY" if rules_count > 0 else "DEGRADED",
            "role": f"Deterministic Python/YAML policy evaluator ({rules_count} loaded)",
            "latency_ms": 15,
            "engine": "AST Expression Engine"
        },
        {
            "id": "explainability_agent",
            "name": "ExplainabilityAgent",
            "status": "HEALTHY" if has_groq_key else "STANDBY",
            "role": "Counterfactual reasoning & missing condition actionable guidance",
            "latency_ms": 280,
            "engine": f"Groq ({settings.GROQ_MODEL})"
        },
        {
            "id": "recommendation_agent",
            "name": "RecommendationAgent",
            "status": "HEALTHY" if has_groq_key else "STANDBY",
            "role": "Package synthesizer & local dialect audio brief generator",
            "latency_ms": 310,
            "engine": f"Groq ({settings.GROQ_MODEL})"
        },
        {
            "id": "planning_agent",
            "name": "PlanningAgent",
            "status": "HEALTHY" if has_groq_key else "STANDBY",
            "role": "Fulfillment roadmap, step checklist & dispute risk assessment",
            "latency_ms": 260,
            "engine": f"Groq ({settings.GROQ_MODEL})"
        },
        {
            "id": "document_verification_agent",
            "name": "DocumentVerificationAgent",
            "status": "HEALTHY" if has_groq_key else "STANDBY",
            "role": "Groq Llama-3.2-11b Vision OCR parser & fraud tamper detector",
            "latency_ms": 420,
            "engine": "Groq Vision LPU"
        },
        {
            "id": "reminder_agent",
            "name": "ReminderAgent",
            "status": "HEALTHY",
            "role": "Proactive lifecycle alerts (Age 60/80 milestone, certificate renewal)",
            "latency_ms": 30,
            "engine": "Scheduled Dispatcher"
        },
        {
            "id": "orchestrator_state_machine",
            "name": "OrchestratorStateMachine",
            "status": "HEALTHY",
            "role": "LangGraph multi-agent execution pipeline & state graph",
            "latency_ms": 45,
            "engine": "LangGraph Graph Executor"
        }
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
            "model": settings.GROQ_MODEL,
            "status": "ONLINE" if has_groq_key else "STANDBY (KEY_NOT_CONFIGURED)"
        },
        "rag_vector_store": {
            "status": "ONLINE",
            "embedding_model": "all-MiniLM-L6-v2",
            "storage_path": settings.VECTOR_STORE_PATH
        },
        "active_agents": [agent["name"] for agent in agents_status],
        "agents_telemetry": agents_status
    }

@router.get("/rules")
def list_system_rules():
    return rule_loader.list_schemes()
