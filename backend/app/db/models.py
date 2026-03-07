"""SQLAlchemy ORM models for the application."""

import uuid as uuid_module
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models with common functionality."""

    pass


class TimestampedMixin:
    """
    Mixin providing created_at and updated_at timestamps.

    All models requiring audit trails should inherit from this mixin.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class User(Base, TimestampedMixin):
    """User identity — username + auto-assigned UUID. No passwords."""

    __tablename__ = "users"

    uuid: Mapped[str] = mapped_column(
        primary_key=True,
        default=lambda: str(uuid_module.uuid4()),
    )
    username: Mapped[str] = mapped_column(nullable=False, unique=True, index=True)

    def __repr__(self) -> str:
        return f"<User(username={self.username!r}, uuid={self.uuid!r})>"


class JudgeRun(Base, TimestampedMixin):
    """Stored result of a judge invocation. PK is md5(content\\0user_uuid) as a cache key."""

    __tablename__ = "judge_runs"

    id: Mapped[str] = mapped_column(primary_key=True)  # md5 hex
    user_uuid: Mapped[str] = mapped_column(
        ForeignKey("users.uuid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    input_text: Mapped[str] = mapped_column(nullable=False)
    output: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    def __repr__(self) -> str:
        return f"<JudgeRun(id={self.id!r}, user_uuid={self.user_uuid!r})>"


class Feedback(Base, TimestampedMixin):
    """User feedback on judge analysis results."""

    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating IN ('up', 'down')", name="ck_feedback_rating"),
        CheckConstraint("content_type IN ('text', 'video')", name="ck_feedback_content_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # Flexible request identifier: md5(content+user_uuid) for text, upload_id for video.
    # Not a FK so it works for both content types regardless of judge_runs existence.
    judge_request_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    rating: Mapped[str] = mapped_column(String(4), nullable=False)  # "up" or "down"
    content_type: Mapped[str] = mapped_column(String(5), nullable=False)  # "text" or "video"

    def __repr__(self) -> str:
        return (
            f"<Feedback(id={self.id!r},"
            f" judge_request_id={self.judge_request_id!r},"
            f" rating={self.rating!r})>"
        )


__all__ = ["Base", "TimestampedMixin", "User", "JudgeRun", "Feedback"]
