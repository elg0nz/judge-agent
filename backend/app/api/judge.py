"""Judge API endpoint — POST /judge for AI detection."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.judge_agent import judge_content
from app.agents.output import DetectionOutput

router = APIRouter(prefix="/judge", tags=["judge"])


class JudgeRequest(BaseModel):
    """Request body for POST /judge."""

    content: str


@router.post("", response_model=DetectionOutput)
async def judge_text(request: JudgeRequest) -> DetectionOutput:
    """Judge text content for AI vs human origin.

    Returns a humanness score 0-100, top signals, and explanation.
    """
    try:
        return await judge_content(content=request.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


__all__ = ["router"]
