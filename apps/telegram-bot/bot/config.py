"""Configuration for Lumo Telegram Bot."""

import os
from pydantic import BaseModel, Field


def resolve_api_base_url() -> str:
    """
    Resolves the FastAPI backend base URL.
    Checks:
    1. LUMO_API_INTERNAL_URL (Injected by Vercel Service Binding)
    2. LUMO_API_BASE_URL (Explicit environment variable override)
    3. Default local development URL: http://localhost:8000/api/v1
    """
    internal_url = os.getenv("LUMO_API_INTERNAL_URL")
    if internal_url:
        base = internal_url.rstrip("/")
        if not base.endswith("/api/v1") and not base.endswith("/v1"):
            return f"{base}/api/v1"
        return base
    return os.getenv("LUMO_API_BASE_URL", "http://localhost:8000/api/v1")


class BotConfig(BaseModel):
    bot_token: str = Field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "mock-token-for-dev")
    )
    api_base_url: str = Field(
        default_factory=resolve_api_base_url
    )
    api_key: str = Field(
        default_factory=lambda: os.getenv("LUMO_API_KEY", "lumo_dev_key_2026")
    )
    default_lang: str = Field(
        default_factory=lambda: os.getenv("LUMO_BOT_DEFAULT_LANG", "en")
    )


bot_config = BotConfig()
