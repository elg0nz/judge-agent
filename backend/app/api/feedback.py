"""Feedback collection endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.dbos import get_db
from app.db.models import Feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    judge_request_id: str
    rating: str  # "up" or "down"
    content_type: str  # "text" or "video"


class FeedbackResponse(BaseModel):
    success: bool
    message: str


@router.post("", response_model=FeedbackResponse)
def submit_feedback(
    request: FeedbackRequest, db: Session = Depends(get_db)
) -> FeedbackResponse:
    """Submit thumbs up/down feedback for a judge result."""
    if request.rating not in ("up", "down"):
        raise HTTPException(400, "Rating must be 'up' or 'down'")
    if request.content_type not in ("text", "video"):
        raise HTTPException(400, "Content type must be 'text' or 'video'")

    try:
        feedback = Feedback(
            judge_request_id=request.judge_request_id,
            rating=request.rating,
            content_type=request.content_type,
        )
        db.add(feedback)
        db.commit()
    except IntegrityError:
        db.rollback()
        return FeedbackResponse(success=True, message="Feedback already recorded")

    return FeedbackResponse(success=True, message="Thanks — this helps us improve.")


__all__ = ["router"]
