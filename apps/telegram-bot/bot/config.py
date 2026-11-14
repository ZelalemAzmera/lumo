"""Configuration for Lumo Telegram Bot."""

import os
from pydantic import BaseModel, Field


class BotConfig(BaseModel):
    bot_token: str = Field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "mock-token-for-dev")
    )
    api_base_url: str = Field(
        default_factory=lambda: os.getenv("LUMO_API_BASE_URL", "http://localhost:8000/api/v1")
    )
    api_key: str = Field(
        default_factory=lambda: os.getenv("LUMO_API_KEY", "lumo_dev_key_2026")
    )
    default_lang: str = Field(
        default_factory=lambda: os.getenv("LUMO_BOT_DEFAULT_LANG", "en")
    )


bot_config = BotConfig()
