from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.api.v1.citizens import router as citizens_router
from app.api.v1.schemes import router as schemes_router
from app.api.v1.eligibility import router as eligibility_router
from app.api.v1.applications import router as applications_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.admin_field import router as admin_field_router
from app.api.v1.admin_district import router as admin_district_router
from app.api.v1.admin_system import router as admin_system_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.auth import router as auth_router
from app.api.v1.rag_chat import router as rag_chat_router
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

# Initialize database tables
init_db()

@asynccontextmanager
async def lifespan(app):
    # ── Startup: Build FAISS RAG index from scheme YAML files (reloaded) ──
    logger.info("Starting Aayu AI RAG ingestion pipeline...")
    try:
        from app.rag.ingestion import seed_scheme_documents
        seed_scheme_documents()
        logger.info("RAG ingestion complete.")
    except Exception as e:
        logger.error(f"RAG ingestion failed: {e}")
    yield
    # ── Shutdown ──

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI System for Continuous Welfare Access and Renewal Assistance for India's Elderly",
    lifespan=lifespan
)

# Enable CORS for Next.js frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(admin_system_router, prefix=settings.API_V1_STR + "/admin/system")
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(rag_chat_router, prefix=settings.API_V1_STR)
app.include_router(citizens_router, prefix=settings.API_V1_STR)
app.include_router(schemes_router, prefix=settings.API_V1_STR)
app.include_router(eligibility_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(reminders_router, prefix=settings.API_V1_STR)
app.include_router(admin_field_router, prefix=settings.API_V1_STR)
app.include_router(admin_district_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Aayu AI Agentic API",
        "docs": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
