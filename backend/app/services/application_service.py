from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import DBApplication, DBCitizen
from app.models.schemas import ApplicationCreate
from app.models.enums import ApplicationStatus

class ApplicationService:
    def create_application(self, db: Session, app_in: ApplicationCreate) -> DBApplication:
        db_app = DBApplication(
            citizen_id=app_in.citizen_id,
            scheme_id=app_in.scheme_id,
            field_worker_id=app_in.field_worker_id,
            status=ApplicationStatus.SUBMITTED
        )
        db.add(db_app)
        db.commit()
        db.refresh(db_app)
        return db_app

    def get_application(self, db: Session, app_id: str) -> Optional[DBApplication]:
        return db.query(DBApplication).filter(DBApplication.id == app_id).first()

    def find_active(self, db: Session, citizen_id: str, scheme_id: str) -> Optional[DBApplication]:
        return (
            db.query(DBApplication)
            .filter(
                DBApplication.citizen_id == citizen_id,
                DBApplication.scheme_id == scheme_id,
                DBApplication.status != ApplicationStatus.REJECTED,
            )
            .first()
        )

    def _attach_names(self, db: Session, apps: List[DBApplication]) -> List[DBApplication]:
        ids = {app.citizen_id for app in apps if app.citizen_id}
        names = {}
        if ids:
            rows = db.query(DBCitizen).filter(DBCitizen.id.in_(ids)).all()
            names = {row.id: row.name for row in rows}
        for app in apps:
            app.citizen_name = names.get(app.citizen_id)
        return apps

    def list_applications(self, db: Session, citizen_id: Optional[str] = None) -> List[DBApplication]:
        query = db.query(DBApplication)
        if citizen_id:
            query = query.filter(DBApplication.citizen_id == citizen_id)
        apps = query.order_by(DBApplication.created_at.desc()).all()
        return self._attach_names(db, apps)

    def update_status(self, db: Session, app_id: str, status: ApplicationStatus, remarks: str = None) -> DBApplication:
        app = self.get_application(db, app_id)
        if app:
            app.status = status
            if remarks:
                app.remarks = remarks
            db.commit()
            db.refresh(app)
        return app

application_service = ApplicationService()
