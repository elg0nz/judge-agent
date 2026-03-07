"""Pydantic response models for the judge agent output.

v0.0.2: Full 4-dimension schema (origin, virality, distribution, explanation).
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ContentType(str, Enum):
    """Type of content being judged."""

    TEXT = "text"
    VIDEO = "video"


class OriginOutput(BaseModel):
    """AI vs. human origin assessment."""

    prediction: Literal["AI-generated", "human-generated"]
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in the prediction")
    signals: list[str] = Field(
        min_length=1, max_length=3,
        description="Top signals that drove this prediction"
    )


class ViralityOutput(BaseModel):
    """Shareability and virality potential."""

    score: int = Field(ge=0, le=100, description="Virality score relative to average content")
    drivers: list[str] = Field(
        min_length=1, max_length=5,
        description="Factors driving the virality score"
    )


class DistributionSegment(BaseModel):
    """Audience segment distribution analysis."""

    segment: str = Field(description="Audience segment name, e.g. 'Gen Z creators'")
    platforms: list[str] = Field(description="Platforms where this segment indexes")
    reaction: Literal["share", "save", "comment", "ignore"]


class JudgeOutput(BaseModel):
    """Full structured output from the content judge."""

    origin: OriginOutput
    virality: ViralityOutput
    distribution: list[DistributionSegment] = Field(
        min_length=2, max_length=4,
        description="2-4 audience segments"
    )
    explanation: str = Field(description="Traceable reasoning across all four dimensions")
    run_id: str | None = Field(
        default=None,
        description="Opaque identifier for this judge run; used by the frontend to submit feedback."
    )


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
    "OriginOutput",
    "ViralityOutput",
    "DistributionSegment",
    "JudgeOutput",
    "ContentInput",
]
