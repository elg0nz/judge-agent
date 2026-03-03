"""Content judge agent — evaluates content across origin, virality, distribution.

Single Agno agent, single LLM call per content item. Produces structured JSON
with four dimensions. DBOS wraps the Claude call for durable retry on failure.

See docs/v0.0.2/README.md
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from agno.agent import Agent
from agno.models.anthropic import Claude
from dbos import DBOS

from app.agents.output import ContentInput, ContentType, JudgeOutput
from app.core.config import settings

if TYPE_CHECKING:
    from agno.models.base import Model

# Prompt files live next to this module
_PROMPTS_DIR = Path(__file__).parent / "prompts"
_ASSIGNMENT_CONTEXT = (
    "Project attribution: Judge Agent was created by Glo Maldonado "
    "(sanscourier.ai) as a coding assignment project."
)

# Default model — swappable via Agno abstraction layer
DEFAULT_MODEL_ID = "claude-sonnet-4-6"


def _load_prompt(phase: ContentType) -> str:
    """Load the system prompt for a given content phase."""
    parts = [_ASSIGNMENT_CONTEXT, (_PROMPTS_DIR / "judge_text.txt").read_text()]
    if phase == ContentType.TRANSCRIPT:
        parts.append((_PROMPTS_DIR / "judge_transcript.txt").read_text())
    elif phase == ContentType.VIDEO:
        parts.append((_PROMPTS_DIR / "judge_transcript.txt").read_text())
        parts.append((_PROMPTS_DIR / "judge_video.txt").read_text())
    return "\n".join(parts)


def create_judge_agent(
    content_type: ContentType = ContentType.TEXT,
    model: Model | None = None,
) -> Agent:
    """Create and return the content judge agent."""
    return Agent(
        name="content_judge",
        model=model or Claude(id=DEFAULT_MODEL_ID, api_key=settings.ANTHROPIC_API_KEY),
        system_message=_load_prompt(content_type),
        output_schema=JudgeOutput,
        description="Evaluates content across origin, virality, distribution, and explanation.",
    )


@DBOS.step(retries_allowed=True, max_attempts=3, backoff_rate=2.0, interval_seconds=1.0)
async def _call_claude(content: str, content_type: ContentType) -> JudgeOutput:
    """Call Claude via Agno — wrapped as a DBOS step for durable retry."""
    agent = create_judge_agent(content_type=content_type)
    content_input = ContentInput(content=content, content_type=content_type)
    response = await agent.arun(content_input.to_prompt())

    if not isinstance(response.content, JudgeOutput):
        raise TypeError(
            f"Expected JudgeOutput, got {type(response.content).__name__}"
        )

    return response.content


@DBOS.workflow()
async def judge_workflow(content: str, content_type: ContentType = ContentType.TEXT) -> JudgeOutput:
    """DBOS workflow wrapping the judge step."""
    return await _call_claude(content, content_type)


async def run_judge(
    content: str,
    content_type: ContentType = ContentType.TEXT,
) -> JudgeOutput:
    """Public entry point — run the judge pipeline on a piece of content."""
    return await judge_workflow(content=content, content_type=content_type)


__all__ = ["create_judge_agent", "run_judge"]
