"""Judge API — POST /judge and GET /judge/history."""

from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.agents.judge_agent import run_judge
from app.agents.output import JudgeOutput
from app.agents.video_pipeline import judge_video_workflow
from app.db.dbos import get_db
from app.db.models import JudgeRun, User

router = APIRouter(prefix="/judge", tags=["judge"])

# Cap history to keep the response snappy — no pagination needed yet.
_HISTORY_LIMIT = 50


class JudgeRequest(BaseModel):
    content: str
    user_uuid: str | None = None


class RunSummary(BaseModel):
    id: str
    input_preview: str
    output: JudgeOutput
    created_at: str


def _run_id(content: str, user_uuid: str) -> str:
    """Cache key (not cryptographic) — dedup identical content from the same user."""
    return hashlib.md5(f"{content}\x00{user_uuid}".encode()).hexdigest()


@router.post("", response_model=JudgeOutput)
async def judge_text(
    request: JudgeRequest,
    db: Session = Depends(get_db),
) -> JudgeOutput:
    """Judge text content. If user_uuid provided, caches by md5(content+user_uuid)."""
    # Validate user_uuid exists before using it for caching/storage.
    # A stale or fabricated UUID would cause an FK violation on insert.
    user_uuid = request.user_uuid
    if user_uuid and not db.query(User).filter_by(uuid=user_uuid).first():
        raise HTTPException(status_code=404, detail="Unknown user_uuid")

    if user_uuid:
        run_id = _run_id(request.content, user_uuid)
        existing = db.query(JudgeRun).filter_by(id=run_id).first()
        if existing:
            cached = JudgeOutput.model_validate(existing.output)
            cached.run_id = run_id
            return cached

    try:
        result = await run_judge(content=request.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if user_uuid:
        try:
            run = JudgeRun(
                id=run_id,
                user_uuid=user_uuid,
                input_text=request.content,
                output=result.model_dump(),
            )
            db.add(run)
            db.commit()
        except IntegrityError:
            db.rollback()
            existing = db.query(JudgeRun).filter_by(id=run_id).first()
            if existing:
                cached = JudgeOutput.model_validate(existing.output)
                cached.run_id = run_id
                return cached

        result.run_id = run_id

    return result


@router.get("/history", response_model=list[RunSummary])
def get_history(user_uuid: str, db: Session = Depends(get_db)) -> list[RunSummary]:
    """Return judge runs for a user, newest first."""
    runs = (
        db.query(JudgeRun)
        .filter_by(user_uuid=user_uuid)
        .order_by(JudgeRun.created_at.desc())
        .limit(_HISTORY_LIMIT)
        .all()
    )
    return [
        RunSummary(
            id=r.id,
            input_preview=r.input_text[:120],
            output=JudgeOutput.model_validate(r.output),
            created_at=r.created_at.isoformat(),
        )
        for r in runs
    ]


class VideoJudgeRequest(BaseModel):
    upload_id: str
    user_uuid: str | None = None


@router.post("/video", response_model=JudgeOutput)
async def judge_video(
    request: VideoJudgeRequest,
    db: Session = Depends(get_db),
) -> JudgeOutput:
    """Judge video content through the video analysis pipeline.

    Validates user_uuid, deduplicates by upload_id, and stores the run.
    """
    user_uuid = request.user_uuid
    if user_uuid and not db.query(User).filter_by(uuid=user_uuid).first():
        raise HTTPException(status_code=404, detail="Unknown user_uuid")

    if user_uuid:
        run_id = _run_id(request.upload_id, user_uuid)
        existing = db.query(JudgeRun).filter_by(id=run_id).first()
        if existing:
            cached = JudgeOutput.model_validate(existing.output)
            cached.run_id = run_id
            return cached

    try:
        result = await judge_video_workflow(request.upload_id, request.user_uuid)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if user_uuid:
        try:
            run = JudgeRun(
                id=run_id,
                user_uuid=user_uuid,
                input_text=request.upload_id,
                output=result.model_dump(),
            )
            db.add(run)
            db.commit()
        except IntegrityError:
            db.rollback()
            existing = db.query(JudgeRun).filter_by(id=run_id).first()
            if existing:
                cached = JudgeOutput.model_validate(existing.output)
                cached.run_id = run_id
                return cached

        result.run_id = run_id

    return result


__all__ = ["router"]
