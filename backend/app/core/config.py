"""Application configuration using Pydantic Settings."""

import json
from pathlib import Path
from typing import Any, Literal

from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, EnvSettingsSource


class _TolerantEnvSource(EnvSettingsSource):
    """EnvSettingsSource that handles dotenv-mangled JSON arrays.

    uv (and some other dotenv parsers) strip inner double-quotes from JSON
    arrays, turning '["a","b"]' into '[a,b]'. The default source calls
    json.loads() and crashes before any field_validator runs.

    This is a known class of dotenv parsing issues:
    - python-dotenv: https://github.com/theskumar/python-dotenv/issues/285
    - uv uses dotenvy (Rust) which has similar quote-stripping behavior

    This override falls back to bracket-stripping + comma-split for list
    fields when json.loads fails.
    """

    def decode_complex_value(
        self, field_name: str, field_info: FieldInfo, value: Any
    ) -> Any:
        if not isinstance(value, str):
            return super().decode_complex_value(field_name, field_info, value)
        v = value.strip()
        try:
            return json.loads(v)
        except (json.JSONDecodeError, ValueError):
            pass
        # Strip bare array brackets: [a,b] → a,b
        if v.startswith("[") and v.endswith("]"):
            v = v[1:-1]
        # Comma-separated fallback; strip stray quotes from each item
        items = [item.strip().strip('"').strip("'") for item in v.split(",")]
        return [item for item in items if item]


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

    # API Keys and Secrets
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    API_KEY_HEADER: str = "X-API-Key"
    ANTHROPIC_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    # File storage
    TMP_DIR: Path = Path("./tmp")

    class Config:
        """Pydantic config for Settings."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: Any,
        env_settings: Any,
        dotenv_settings: Any,
        file_secret_settings: Any | None = None,
        secrets_settings: Any | None = None,
        **_: Any,
    ) -> tuple[Any, ...]:
        """Replace the default EnvSettingsSource with our tolerant variant."""
        secret_source = (
            file_secret_settings
            if file_secret_settings is not None
            else secrets_settings
        )
        return (
            init_settings,
            _TolerantEnvSource(settings_cls),
            dotenv_settings,
            secret_source,
        )

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
