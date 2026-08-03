from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.db_models import DBUser
from app.core.security import verify_password, get_password_hash, create_access_token
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

@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(DBUser).filter(DBUser.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name,
            "district": user.district
        }
    }

@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
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
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name,
            "district": user.district
        }
    }

class UserUpdate(BaseModel):
    full_name: str = None
    role: str = None
    district: str = None

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """
    List all registered users.
    """
    users = db.query(DBUser).all()
    return [{
        "id": u.id,
        "username": u.username,
        "role": u.role,
        "full_name": u.full_name,
        "district": u.district
    } for u in users]

@router.put("/users/{user_id}")
def update_user(user_id: str, user_in: UserUpdate, db: Session = Depends(get_db)):
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
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "district": user.district
    }

