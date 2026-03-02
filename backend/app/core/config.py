"""Application configuration using Pydantic Settings."""

from typing import Literal

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
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/judge_agent"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600
    DATABASE_ECHO: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

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
