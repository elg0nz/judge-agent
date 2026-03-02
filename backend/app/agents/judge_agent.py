"""Content judge agent — evaluates content for AI vs. human origin.

Single Agno agent, single LLM call per content item. Produces a humanness
score (0–100), top signals, and explanation as structured JSON.

See ARCHITECTURE.md § "Single Agno Agent, Structured Output"
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from agno.agent import Agent
from agno.models.anthropic import Claude

from app.agents.output import ContentInput, ContentType, DetectionOutput
from app.core.config import settings

if TYPE_CHECKING:
    from agno.models.base import Model

# Prompt files live next to this module
_PROMPTS_DIR = Path(__file__).parent / "prompts"

# Default model — swappable via Agno abstraction layer
DEFAULT_MODEL_ID = "claude-sonnet-4-20250514"


def _load_prompt(phase: ContentType) -> str:
    """Load the system prompt for a given content phase.

    Phase 1 (text) uses judge_text.txt alone.
    Phase 2 (transcript) appends judge_transcript.txt.
    Phase 3 (video) appends both transcript and video additions.
    """
    base = (_PROMPTS_DIR / "judge_text.txt").read_text()
    if phase == ContentType.TRANSCRIPT:
        base += "\n" + (_PROMPTS_DIR / "judge_transcript.txt").read_text()
    elif phase == ContentType.VIDEO:
        base += "\n" + (_PROMPTS_DIR / "judge_transcript.txt").read_text()
        base += "\n" + (_PROMPTS_DIR / "judge_video.txt").read_text()
    return base


def create_judge_agent(
    content_type: ContentType = ContentType.TEXT,
    model: Model | None = None,
) -> Agent:
    """Create and return the content judge agent.

    Args:
        content_type: Determines which prompt phase to load.
        model: Agno model instance. Defaults to Claude Sonnet.

    Returns:
        Configured Agno Agent ready to judge content.
    """
    return Agent(
        name="content_judge",
        model=model or Claude(id=DEFAULT_MODEL_ID, api_key=settings.ANTHROPIC_API_KEY),
        system_message=_load_prompt(content_type),
        output_schema=DetectionOutput,
        description="Evaluates content for AI vs. human origin.",
    )


async def judge_content(
    content: str,
    content_type: ContentType = ContentType.TEXT,
    model: Model | None = None,
) -> DetectionOutput:
    """Run the judge pipeline on a piece of content.

    This is the main entry point for Phase 1 (text). Phases 2 and 3 will
    extend the ingestion layer but call this same function with preprocessed text.

    Args:
        content: The text content to judge.
        content_type: Type of content being judged.
        model: Optional Agno model override.

    Returns:
        Structured detection output with score, signals, and explanation.
    """
    agent = create_judge_agent(content_type=content_type, model=model)
    content_input = ContentInput(content=content, content_type=content_type)

    response = await agent.arun(content_input.to_prompt())

    # Agno returns structured output matching DetectionOutput when output_schema is set
    if not isinstance(response.content, DetectionOutput):
        raise TypeError(
            f"Expected DetectionOutput, got {type(response.content).__name__}"
        )

    return response.content


__all__ = ["create_judge_agent", "judge_content"]
