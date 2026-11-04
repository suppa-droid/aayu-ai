from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.db_models import DBUser
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    district: str = None

@router.get("/me")
def read_current_user(current: DBUser = Depends(get_current_user)):
    """Used by the portals to check that the saved token still matches a user."""
    return _user_dict(current)

@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(DBUser).filter(DBUser.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account is deactivated.")
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_dict(user)
    }

ADMIN_ROLES = {"DISTRICT_ADMIN", "SYSTEM_ADMIN", "LEVEL_2_DISTRICT_ADMIN", "LEVEL_3_SYSTEM_ADMIN"}
SYSTEM_ADMIN_ROLES = {"SYSTEM_ADMIN", "LEVEL_3_SYSTEM_ADMIN"}

def _user_dict(user: DBUser) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "district": user.district,
        "is_active": bool(user.is_active),
    }

def _reject_self_or_last_admin(db: Session, actor: DBUser, target: DBUser) -> None:
    if actor.id == target.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate or delete the account you are signed in with.")
    if target.role in SYSTEM_ADMIN_ROLES and target.is_active:
        others = (
            db.query(DBUser)
            .filter(DBUser.id != target.id, DBUser.role.in_(SYSTEM_ADMIN_ROLES), DBUser.is_active.is_(True))
            .count()
        )
        if others == 0:
            raise HTTPException(status_code=400, detail="The last system admin has to stay active.")

def require_admin(user: DBUser = Depends(get_current_user)) -> DBUser:
    if user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user

@router.post("/register", response_model=Token)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _: DBUser = Depends(require_admin),
) -> Any:
    """
    Create a new user.
    """
    user = db.query(DBUser).filter(DBUser.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = DBUser(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        district=user_in.district
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_dict(user)
    }

class UserUpdate(BaseModel):
    full_name: str = None
    role: str = None
    district: str = None

class UserActiveUpdate(BaseModel):
    is_active: bool

@router.get("/users")
def list_users(db: Session = Depends(get_db), _: DBUser = Depends(require_admin)):
    """
    List all registered users.
    """
    users = db.query(DBUser).all()
    return [_user_dict(u) for u in users]

@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    _: DBUser = Depends(require_admin),
):
    """
    Update an existing user.
    """
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.district is not None:
        user.district = user_in.district
        
    db.commit()
    db.refresh(user)
    return _user_dict(user)

@router.patch("/users/{user_id}/active")
def set_user_active(
    user_id: str,
    body: UserActiveUpdate,
    db: Session = Depends(get_db),
    actor: DBUser = Depends(require_admin),
):
    """Deactivate or activate a portal account. A deactivated user cannot sign in."""
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not body.is_active:
        _reject_self_or_last_admin(db, actor, user)
    user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return _user_dict(user)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    actor: DBUser = Depends(require_admin),
):
    """Remove a portal account. Filed applications stay, because they store the worker name as text."""
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _reject_self_or_last_admin(db, actor, user)
    db.delete(user)
    db.commit()
    return {"status": "DELETED", "id": user_id}

