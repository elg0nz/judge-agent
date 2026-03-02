"""Application configuration using Pydantic Settings."""

import json
from typing import Any, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Configuration supports development, testing, and production environments
    via the ENVIRONMENT variable.
    """

    # Environment
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Database
    # Default: SQLite for local dev. Set to postgresql://... for production.
    DATABASE_URL: str = "sqlite:///./judge_agent.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600
    DATABASE_ECHO: bool = False

    # DBOS durable execution system database (separate from app DB)
    DBOS_SYSTEM_DATABASE_URL: str = "sqlite:///dbos_system.db"

    @property
    def is_sqlite(self) -> bool:
        """True when DATABASE_URL targets SQLite."""
        return self.DATABASE_URL.startswith("sqlite")

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Accept JSON arrays, bare brackets, or comma-separated strings.

        Dotenv parsers (including uv --env-file) sometimes strip inner quotes
        from JSON arrays, producing e.g. [http://localhost:3000,...] instead of
        ["http://localhost:3000",...]. This validator handles all variants.
        """
        if isinstance(v, list):
            return v
        if not isinstance(v, str):
            return v
        v = v.strip()
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return [str(item) for item in parsed]
        except (json.JSONDecodeError, ValueError):
            pass
        # Strip bare brackets (e.g. [http://a,http://b] → http://a,http://b)
        if v.startswith("[") and v.endswith("]"):
            v = v[1:-1]
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    # API Keys and Secrets
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    API_KEY_HEADER: str = "X-API-Key"
    ANTHROPIC_API_KEY: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        """Pydantic config for Settings."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def model_post_init(self, __context: object) -> None:
        """Validate environment after model initialization."""
        if (
            self.ENVIRONMENT == "production"
            and self.SECRET_KEY == "dev-secret-key-change-in-production"
        ):
            raise ValueError(
                "SECRET_KEY must be changed in production environment"
            )


settings = Settings()

__all__ = ["Settings", "settings"]
