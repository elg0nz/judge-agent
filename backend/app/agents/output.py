"""Pydantic response models for the judge agent output.

Defines the structured output schema that the judge LLM produces.
This schema is stable across all phases (text, transcript, video).

See ARCHITECTURE.md § "System Architecture" → Response block
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

# --- Enums ---


class ContentType(str, Enum):
    """Type of content being judged."""

    TEXT = "text"
    TRANSCRIPT = "transcript"
    VIDEO = "video"


class OriginPrediction(str, Enum):
    """Whether content is AI-generated or human-generated."""

    AI = "ai"
    HUMAN = "human"
    MIXED = "mixed"


class AudienceReaction(str, Enum):
    """Likely audience reaction to content."""

    SHARE = "share"
    SAVE = "save"
    COMMENT = "comment"
    IGNORE = "ignore"


# --- Output Models ---


class OriginAnalysis(BaseModel):
    """AI vs. human origin prediction with supporting signals."""

    prediction: OriginPrediction = Field(
        description="AI-generated, human-generated, or mixed"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in the prediction (0.0 to 1.0)"
    )
    signals: list[str] = Field(
        min_length=1, max_length=5,
        description="Top signals that drove this prediction"
    )


class ViralityAnalysis(BaseModel):
    """Virality score with structural drivers."""

    score: int = Field(
        ge=0, le=100,
        description="Virality score 0-100, relative to average content in this format"
    )
    drivers: list[str] = Field(
        min_length=1, max_length=6,
        description="Structural factors driving the score (hook, emotion, controversy, etc.)"
    )


class AudienceSegment(BaseModel):
    """A single audience segment likely to engage with the content."""

    segment: str = Field(
        description="Interest-graph-based audience name (not demographic)"
    )
    why: str = Field(
        description="Why this segment would engage with this content"
    )
    platforms: list[str] = Field(
        min_length=1,
        description="Platforms where this segment indexes (TikTok, X, LinkedIn, etc.)"
    )
    reaction: AudienceReaction = Field(
        description="Most likely reaction from this segment"
    )


class JudgeOutput(BaseModel):
    """Complete judge output — the single structured response from one LLM call.

    All four outputs are produced in a single reasoning pass for internal
    consistency. The explanation references the same signals used for scoring.
    """

    origin: OriginAnalysis
    virality: ViralityAnalysis
    distribution: list[AudienceSegment] = Field(
        min_length=2, max_length=4,
        description="2-4 audience segments likely to engage"
    )
    explanation: str = Field(
        description="Traceable reasoning tying origin, virality, and distribution together"
    )


# --- Input Models ---


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
    "OriginPrediction",
    "AudienceReaction",
    "OriginAnalysis",
    "ViralityAnalysis",
    "AudienceSegment",
    "JudgeOutput",
    "ContentInput",
]
