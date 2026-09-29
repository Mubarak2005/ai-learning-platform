"""
Centralized application configuration.

All values are overridable via environment variables (see .env.example).
Nothing here should be hardcoded secrets — this file only defines defaults
and typing for local development.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "AI Learning & Competency Platform API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True

    # --- Security / Auth (foundation only, full flow in Phase 2) ---
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/ai_learning_platform"
    )

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # --- AI Provider (kept provider-agnostic; swap implementation in services/ai) ---
    AI_PROVIDER: str = "mock"  # mock | anthropic | openai | azure_openai
    AI_API_KEY: str = ""
    AI_MODEL: str = ""

    # --- iGOT Karmayogi integration ---
    IGOT_MODE: str = "mock"  # mock | live
    IGOT_BASE_URL: str = ""
    IGOT_API_KEY: str = ""

    # --- NSSTA / TPAC integration ---
    NSSTA_MODE: str = "mock"  # mock | live
    NSSTA_BASE_URL: str = ""

    # --- Email / OTP delivery ---
    # "mock" logs the OTP to the application log instead of sending an email —
    # useful for local dev without SMTP credentials. Switch to "smtp" once
    # SMTP_* values below are filled in.
    EMAIL_MODE: str = "mock"  # mock | smtp
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "no-reply@ai-learning-platform.gov.in"
    SMTP_FROM_NAME: str = "AI Learning Platform"

    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5

    # --- File storage (Phase 8) ---
    # Local disk for dev/demo; swap for S3/Azure Blob/GCS in production by
    # changing UPLOAD_DIR handling in the trainer materials route only.
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".pdf", ".pptx", ".docx"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
