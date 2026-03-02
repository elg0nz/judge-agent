"""DBOS (Database Object Store) initialization with connection pooling."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.models import Base


class DatabaseManager:
    """
    Manages database connections and session lifecycle.

    Provides connection pooling, session factory, and utilities for database access.
    """

    def __init__(self, database_url: str | None = None) -> None:
        """
        Initialize database manager with connection pool.

        Args:
            database_url: Database connection string. Defaults to settings.DATABASE_URL.
        """
        url = database_url or settings.DATABASE_URL
        is_sqlite = url.startswith("sqlite")

        if is_sqlite:
            # SQLite does not support connection pool parameters.
            # check_same_thread=False is required for FastAPI's threaded request handling.
            self.engine: Engine = create_engine(
                url,
                connect_args={"check_same_thread": False},
                echo=settings.DATABASE_ECHO,
            )
        else:
            self.engine = create_engine(
                url,
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_MAX_OVERFLOW,
                pool_timeout=settings.DATABASE_POOL_TIMEOUT,
                pool_recycle=settings.DATABASE_POOL_RECYCLE,
                echo=settings.DATABASE_ECHO,
            )

        self.SessionLocal = sessionmaker(
            bind=self.engine,
            class_=Session,
            expire_on_commit=False,
            autoflush=False,
        )

    def create_all_tables(self) -> None:
        """
        Create all tables in the database.

        Should only be used in development; migrations handle schema in production.
        """
        Base.metadata.create_all(self.engine)

    def drop_all_tables(self) -> None:
        """
        Drop all tables from the database.

        WARNING: Destructive operation. Use only in testing or development.
        """
        Base.metadata.drop_all(self.engine)

    def get_session(self) -> Session:
        """
        Get a new database session.

        Returns:
            Session: SQLAlchemy session instance from the connection pool.
        """
        return self.SessionLocal()

    def close(self) -> None:
        """Close all connections in the pool."""
        self.engine.dispose()


# Global database manager instance (lazy-initialized)
_db_manager: DatabaseManager | None = None


def get_db_manager() -> DatabaseManager:
    """
    Get or create the global database manager instance.

    Returns:
        DatabaseManager: Singleton database manager instance.
    """
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database session.

    Usage:
        @app.get("/items")
        def list_items(db: Session = Depends(get_db)):
            return db.query(Item).all()

    Yields:
        Session: Database session that is automatically closed after request.
    """
    db = get_db_manager().get_session()
    try:
        yield db
    finally:
        db.close()


__all__ = ["DatabaseManager", "get_db_manager", "get_db"]
