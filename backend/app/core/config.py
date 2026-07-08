"""Application configuration.

Defaults keep the demo zero-infrastructure: a local SQLite file. Set
``DATABASE_URL`` to a PostgreSQL DSN (e.g. ``postgresql+psycopg://...``) for a
production-style deployment without changing any code.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  # .../backend


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "smart-health-api"
    version: str = "1.0.0"

    # SQLite by default; override with a Postgres URL in production.
    database_url: str = f"sqlite:///{(BASE_DIR / 'smarthealth.db').as_posix()}"

    # District identity used across the app / demo data.
    district_name: str = "Bareilly"

    # CORS origins allowed to call the API (the Next.js dev server).
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # --- Google AI (Gemini) -----------------------------------------------------
    # Optional. Get a free key at https://aistudio.google.com/apikey. When unset,
    # the AI features fall back to deterministic templates (demo still works).
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
