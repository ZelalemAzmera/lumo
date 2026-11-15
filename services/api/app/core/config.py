import os
from typing import List

class Settings:
    PROJECT_NAME: str = "Lumo Accessibility API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "lumo-secret-development-key-2026")
    DEFAULT_API_KEY: str = os.getenv("LUMO_DEFAULT_API_KEY", "lumo-test-key-2026")
    
    # Explicit provisioned tenant keys (Strict verification; no prefix-only matching)
    PROVISIONED_API_KEYS: List[str] = [
        k.strip() for k in os.getenv(
            "LUMO_PROVISIONED_API_KEYS", 
            "lumo-test-key-2026,lumo_dev_key_2026,alx_savanna_tenant_key_2026"
        ).split(",") if k.strip()
    ]
    
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

settings = Settings()
