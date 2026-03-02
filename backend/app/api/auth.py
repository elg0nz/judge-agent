"""Auth API — POST /auth/signup for username-only identity."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.dbos import get_db
from app.db.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)


class UserResponse(BaseModel):
    username: str
    uuid: str


@router.post("/signup", response_model=UserResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)) -> UserResponse:
    """Create a new user or return existing user for this username."""
    user = db.query(User).filter_by(username=request.username).first()
    if user is None:
        try:
            user = User(username=request.username)
            db.add(user)
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter_by(username=request.username).first()
    if user is None:
        raise HTTPException(500, "User creation failed")
    return UserResponse(username=user.username, uuid=user.uuid)


__all__ = ["router"]
