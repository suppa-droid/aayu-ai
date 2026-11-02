from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.db_models import Base

# SQLite connect_args
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    from app.models.db_models import DBUser
    from app.core.security import get_password_hash
    Base.metadata.create_all(bind=engine)
    
    # Seed default users
    db = SessionLocal()
    try:
        admin = db.query(DBUser).filter(DBUser.username == "admin").first()
        if not admin:
            admin = DBUser(
                username="admin",
                hashed_password=get_password_hash("password123"),
                full_name="System Admin",
                role="SYSTEM_ADMIN"
            )
            db.add(admin)
        fw = db.query(DBUser).filter(DBUser.username == "field_worker").first()
        if not fw:
            fw = DBUser(
                username="field_worker",
                hashed_password=get_password_hash("password123"),
                full_name="Priya Sharma",
                role="FIELD_WORKER"
            )
            db.add(fw)
        # Also add a district admin user if needed
        dist_admin = db.query(DBUser).filter(DBUser.username == "district_admin").first()
        if not dist_admin:
            dist_admin = DBUser(
                username="district_admin",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Rajesh Sharma",
                role="DISTRICT_ADMIN",
                district="South Delhi"
            )
            db.add(dist_admin)
        db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
