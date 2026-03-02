"""SQLAlchemy ORM models for the application."""

import uuid as uuid_module
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, func
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


class Case(Base, TimestampedMixin):
    """
    Legal case entity.

    Represents a judicial case that will be analyzed by the reasoning agent.
    """

    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(nullable=True)
    jurisdiction: Mapped[str | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(default="open", nullable=False)

    def __repr__(self) -> str:
        """Return string representation of Case."""
        return f"<Case(id={self.id}, title={self.title!r})>"


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


class JudgeRun(Base):
    """Stored result of a judge invocation, keyed by md5(input_text + user_uuid)."""

    __tablename__ = "judge_runs"

    id: Mapped[str] = mapped_column(primary_key=True)  # md5 hex
    user_uuid: Mapped[str] = mapped_column(
        ForeignKey("users.uuid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    input_text: Mapped[str] = mapped_column(nullable=False)
    output: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<JudgeRun(id={self.id!r}, user_uuid={self.user_uuid!r})>"


__all__ = ["Base", "TimestampedMixin", "Case", "User", "JudgeRun"]
