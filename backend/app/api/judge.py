"""Judge API endpoint — POST /judge."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.judge_agent import run_judge
from app.agents.output import JudgeOutput

router = APIRouter(prefix="/judge", tags=["judge"])


class JudgeRequest(BaseModel):
    """Request body for POST /judge."""

    content: str


@router.post("", response_model=JudgeOutput)
async def judge_text(request: JudgeRequest) -> JudgeOutput:
    """Judge text content across origin, virality, distribution, and explanation."""
    try:
        return await run_judge(content=request.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


__all__ = ["router"]
