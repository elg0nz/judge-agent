"""Pydantic response models for the judge agent output.

v0.0.1: AI detection only.
score 100 = definitely human, 0 = definitely AI.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ContentType(str, Enum):
    """Type of content being judged."""

    TEXT = "text"
    TRANSCRIPT = "transcript"
    VIDEO = "video"


class DetectionOutput(BaseModel):
    """Structured output from the AI detection judge."""

    score: int = Field(ge=0, le=100, description="Humanness score: 100=human, 0=AI")
    signals: list[str] = Field(
        min_length=1, max_length=5,
        description="Top signals that drove this score"
    )
    explanation: str = Field(description="One-paragraph reasoning for the score")


class ContentInput(BaseModel):
    """Input to the judge pipeline."""

    content: str = Field(description="The content to judge")
    content_type: ContentType = Field(
        default=ContentType.TEXT,
        description="What kind of content this is"
    )

    def to_prompt(self) -> str:
        """Format content for the judge agent prompt."""
        return (
            f"Content type: {self.content_type.value}\n"
            f"---\n"
            f"{self.content}"
        )


__all__ = [
    "ContentType",
    "DetectionOutput",
    "ContentInput",
]
