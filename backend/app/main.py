"""Main FastAPI application entry point with health check and root endpoints."""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.judge import router as judge_router
from app.core.config import settings
from app.db.dbos import get_db_manager


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """
    Application lifespan handler.

    Initializes DBOS for durable execution, then auto-creates all SQLite
    tables in development so the server works out of the box.
    """
    from dbos import DBOS, DBOSConfig
    config: DBOSConfig = {
        "name": "judge-agent",
        "system_database_url": settings.DBOS_SYSTEM_DATABASE_URL,
    }
    DBOS(config=config)
    DBOS.launch()
    if settings.ENVIRONMENT == "development" and settings.is_sqlite:
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
        title="Judge Agent API",
        description="Judicial reasoning agent powered by DBOS and Agno",
        version="0.0.1",
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Register routers
    app.include_router(judge_router)
    app.include_router(auth_router)

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
            "name": "Judge Agent API",
            "version": "0.0.1",
            "environment": settings.ENVIRONMENT,
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
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "type": type(exc).__name__,
            },
        )

    return app


# Create app instance for uvicorn
app = create_app()

__all__ = ["app", "create_app"]
