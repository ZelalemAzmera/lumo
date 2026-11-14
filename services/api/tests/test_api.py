import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
AUTH_HEADERS = {"X-Lumo-Key": settings.DEFAULT_API_KEY}

def test_health_endpoint():
    response = client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "version" in data

def test_captions_auth_failure():
    # Without X-Lumo-Key
    response = client.post("/v1/captions/generate", json={"media_url": "https://example.com/video.mp4"})
    assert response.status_code == 401

def test_captions_generation_success():
    response = client.post(
        "/v1/captions/generate",
        json={"media_url": "https://example.com/video.mp4", "language": "am"},
        headers=AUTH_HEADERS
    )
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "QUEUED"

def test_get_caption_vtt():
    response = client.get("/v1/captions/sample-lesson-am")
    assert response.status_code == 200
    assert "text/vtt" in response.headers["content-type"]
    assert "WEBVTT" in response.text
    assert "እንኳን ወደዚህ" in response.text

def test_packages_generation_and_download():
    # Generate package
    gen_res = client.post(
        "/v1/packages/generate",
        json={
            "lesson_id": "test-lesson-101",
            "title": "Accessible Web Fundamentals",
            "video_url": "https://example.com/video.mp4"
        },
        headers=AUTH_HEADERS
    )
    assert gen_res.status_code == 202
    pkg_data = gen_res.json()
    pkg_id = pkg_data["package_id"]

    # Download package
    dl_res = client.get(f"/v1/packages/{pkg_id}/download")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/zip"
    assert len(dl_res.content) > 100

def test_document_processing():
    sample_text = b"HEADING 1: DIGITAL ACCESSIBILITY\n\nThis is paragraph one explaining the core requirements.\n\nHEADING 2: ETHIOPIAN LOCALIZATION\n\nAmharic Fidel typography requires adequate line height."
    files = {"file": ("test.txt", sample_text, "text/plain")}
    data = {"title": "Test Syllabus", "lang": "en"}

    response = client.post(
        "/v1/documents/process",
        files=files,
        data=data,
        headers=AUTH_HEADERS
    )
    assert response.status_code == 202
    result = response.json()
    assert result["status"] == "COMPLETED"
    assert "accessible_html_url" in result

def test_ai_educator_ask():
    response = client.post(
        "/v1/lessons/lesson-01/ask",
        json={"question": "What does HTML provide?", "language": "en"},
        headers=AUTH_HEADERS
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["citations"]) > 0
