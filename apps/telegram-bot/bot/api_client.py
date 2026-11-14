"""Asynchronous API client connecting Telegram bot to Lumo FastAPI backend."""

import httpx
from typing import Dict, Any, Optional
from .config import bot_config


class LumoAPIClient:
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or bot_config.api_base_url).rstrip("/")
        self.api_key = api_key or bot_config.api_key
        self.headers = {
            "X-Lumo-Key": self.api_key,
            "Accept": "application/json"
        }

    async def get_health(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/health", headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def get_lesson(self, lesson_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/lessons/{lesson_id}", headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def get_captions_vtt(self, lesson_id: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/captions/{lesson_id}.vtt", headers=self.headers)
            resp.raise_for_status()
            return resp.text

    async def ask_question(self, lesson_id: str, question: str, language: str = "en") -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/lessons/{lesson_id}/ask",
                headers=self.headers,
                json={"question": question, "language": language}
            )
            resp.raise_for_status()
            return resp.json()

    async def generate_offline_package(self, lesson_id: str, title: str, html_body: str = "") -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{self.base_url}/packages/generate",
                headers=self.headers,
                json={
                    "lesson_id": lesson_id,
                    "title": title,
                    "html_body": html_body or f"<h1>{title}</h1><p>Accessible offline content for lesson {lesson_id}.</p>"
                }
            )
            resp.raise_for_status()
            return resp.json()

    async def download_package_bytes(self, package_id: str) -> bytes:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{self.base_url}/packages/{package_id}/download",
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.content


api_client = LumoAPIClient()
