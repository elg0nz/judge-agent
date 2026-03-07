"""Main FastAPI application entry point with health check and root endpoints."""

import logging
from contextlib import asynccontextmanager
from typing import Any

from dbos import DBOS, DBOSConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.feedback import router as feedback_router
from app.api.frames import router as frames_router
from app.api.judge import router as judge_router
from app.api.upload import router as upload_router
from app.core.config import settings
from app.db.dbos import get_db_manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """
    Application lifespan handler.

    Initializes DBOS for durable execution, then auto-creates all SQLite
    tables in development so the server works out of the box.
    """
    # DBOS.launch() runs once per worker process (expected with multi-worker uvicorn).
    # This is intentional: each worker needs its own DBOS context.
    config: DBOSConfig = {
        "name": "judge-agent",
        "system_database_url": settings.DBOS_SYSTEM_DATABASE_URL,
    }
    DBOS(config=config)
    DBOS.launch()
    if settings.ENVIRONMENT == "development" and settings.is_sqlite:
        # create_all_tables() is idempotent (CREATE TABLE IF NOT EXISTS).
        get_db_manager().create_all_tables()
    yield


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.

    Sets up middleware, routes, and exception handlers.

    Returns:
        FastAPI: Configured application instance.
    """
    app = FastAPI(
        title="Judge Agent API — Coding Assignment by Glo Maldonado (sanscourier.ai)",
        description=(
            "Agentic system to detect non-human created content. "
            "Created by Glo Maldonado (sanscourier.ai) as a coding assignment project."
        ),
        version="0.0.4",
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Register routers
    app.include_router(judge_router)
    app.include_router(auth_router)
    app.include_router(upload_router)
    app.include_router(feedback_router)
    app.include_router(frames_router)

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["root"])
    async def root() -> dict[str, Any]:
        """
        Root endpoint returning API metadata.

        Returns:
            Dictionary with API information.
        """
        return {
            "name": "Judge Agent API — by Glo Maldonado (sanscourier.ai)",
            "version": "0.0.4",
            "environment": settings.ENVIRONMENT,
            "project_attribution": "Coding assignment project by Glo Maldonado (sanscourier.ai)",
            "docs_url": "/docs",
            "openapi_url": "/openapi.json",
        }

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        """
        Health check endpoint for monitoring.

        Returns:
            Dictionary with health status.
        """
        return {"status": "healthy", "environment": settings.ENVIRONMENT}

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Any, exc: Exception) -> JSONResponse:
        """
        Global exception handler for unhandled errors.

        Args:
            request: The request that caused the error.
            exc: The exception that was raised.

        Returns:
            JSON response with error details.
        """
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


# Create app instance for uvicorn
app = create_app()

__all__ = ["app", "create_app"]
