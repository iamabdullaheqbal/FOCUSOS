"""
FocusOS — Configuration
========================
All settings loaded from environment variables.
Local PostgreSQL — no Neon, no Supabase. AI powered by Mistral AI.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "FocusOS"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/focusos"
    )

    # ── Auth ──────────────────────────────────────────────────────────────────
    APP_SECRET_KEY: str = os.getenv("APP_SECRET_KEY", "dev-secret-change-in-production")
    TOKEN_TTL_HOURS: int = int(os.getenv("TOKEN_TTL_HOURS", "24"))
    REFRESH_TTL_DAYS: int = int(os.getenv("REFRESH_TTL_DAYS", "30"))

    # ── Mistral AI ────────────────────────────────────────────────────────────
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    MISTRAL_VISION_MODEL: str = os.getenv("MISTRAL_VISION_MODEL", "pixtral-12b-latest")
    MISTRAL_MAX_RETRIES: int = int(os.getenv("MISTRAL_MAX_RETRIES", "3"))
    MISTRAL_RETRY_DELAY: float = float(os.getenv("MISTRAL_RETRY_DELAY", "1.5"))
    MISTRAL_CACHE_TTL: int = int(os.getenv("MISTRAL_CACHE_TTL", "300"))
    MISTRAL_CACHE_MAXSIZE: int = int(os.getenv("MISTRAL_CACHE_MAXSIZE", "100"))

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "1000/hour")

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ── Server ────────────────────────────────────────────────────────────────
    PORT: int = int(os.getenv("PORT", "8000"))

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
