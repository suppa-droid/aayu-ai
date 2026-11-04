from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.db_models import Base

# SQLite connect_args
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def _ensure_renewal_due_column():
    """create_all does not add columns to an existing SQLite table."""
    inspector = inspect(engine)
    if "applications" not in inspector.get_table_names():
        return
    column_names = {column["name"] for column in inspector.get_columns("applications")}
    if "renewal_due_at" in column_names:
        return
    try:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE applications ADD COLUMN renewal_due_at DATETIME"))
    except OperationalError as exc:
        if "duplicate column" not in str(exc).lower():
            raise

def _ensure_user_active_column():
    """create_all does not add columns to an existing users table."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    column_names = {column["name"] for column in inspector.get_columns("users")}
    if "is_active" in column_names:
        return
    try:
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"
            ))
    except OperationalError as exc:
        if "duplicate column" not in str(exc).lower():
            raise

def init_db():
    from app.models.db_models import DBUser
    from app.core.security import get_password_hash
    Base.metadata.create_all(bind=engine)
    _ensure_renewal_due_column()
    _ensure_user_active_column()
    
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
