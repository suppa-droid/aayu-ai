from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import DBApplication, DBCitizen
from app.models.schemas import ApplicationCreate
from app.models.enums import ApplicationStatus
from app.rules_engine.rule_loader import rule_loader

_RENEWAL_ALERT_STATUSES = (ApplicationStatus.APPROVED, ApplicationStatus.RENEWAL_DUE)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _as_utc_naive(moment: datetime) -> datetime:
    if moment.tzinfo is None or moment.tzinfo.utcoffset(moment) is None:
        return moment
    return moment.astimezone(timezone.utc).replace(tzinfo=None)


def is_renewal_alert(status, renewal_due_at, now, lead_days: int = 30) -> bool:
    """True when an approved or renewal-due application is inside the lead window, including overdue."""
    if status not in _RENEWAL_ALERT_STATUSES:
        return False
    if not isinstance(renewal_due_at, datetime) or not isinstance(now, datetime):
        return False
    due = _as_utc_naive(renewal_due_at)
    current = _as_utc_naive(now)
    return (due - current) <= timedelta(days=lead_days)


def _renewal_due_on(scheme_id: str, base: Optional[datetime]) -> Optional[datetime]:
    scheme = rule_loader.get_scheme(scheme_id) if scheme_id else None
    if not scheme or scheme.get("renewal_period_days") is None:
        return None
    start = base or _utc_now()
    return start + timedelta(days=int(scheme["renewal_period_days"]))


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
            scheme = rule_loader.get_scheme(app.scheme_id)
            app.scheme_name = scheme["name"] if scheme else None
        return apps

    def _backfill_renewal_dates(self, db: Session, apps: List[DBApplication]) -> None:
        changed = False
        for app in apps:
            if app.status != ApplicationStatus.APPROVED or app.renewal_due_at is not None:
                continue
            due = _renewal_due_on(app.scheme_id, app.updated_at or app.created_at)
            if due is None:
                continue
            app.renewal_due_at = due
            changed = True
        if changed:
            db.commit()

    def list_applications(self, db: Session, citizen_id: Optional[str] = None) -> List[DBApplication]:
        query = db.query(DBApplication)
        if citizen_id:
            query = query.filter(DBApplication.citizen_id == citizen_id)
        apps = query.order_by(DBApplication.created_at.desc()).all()
        self._backfill_renewal_dates(db, apps)
        return self._attach_names(db, apps)

    def update_status(self, db: Session, app_id: str, status: ApplicationStatus, remarks: str = None) -> DBApplication:
        app = self.get_application(db, app_id)
        if app:
            app.status = status
            if remarks:
                app.remarks = remarks
            if status == ApplicationStatus.APPROVED and app.renewal_due_at is None:
                due = _renewal_due_on(app.scheme_id, _utc_now())
                if due is not None:
                    app.renewal_due_at = due
            db.commit()
            db.refresh(app)
        return app

application_service = ApplicationService()
