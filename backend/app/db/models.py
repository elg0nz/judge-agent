"""SQLAlchemy ORM models for the application."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, func
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


__all__ = ["Base", "TimestampedMixin", "Case"]
