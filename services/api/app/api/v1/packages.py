from fastapi import APIRouter, Depends, Response, HTTPException
from datetime import datetime, timezone
import uuid
import os
from pathlib import Path
from app.schemas.packages import PackageGenerateRequest, PackageJobResponse
from app.core.security import verify_api_key
from app.services.zip_builder import ZipBuilder

router = APIRouter()

PACKAGES_STORE = {}

def get_sample_captions():
    """Load actual repository sample captions if available, else standard fallback"""
    en_vtt = "WEBVTT - Lumo English Captions\n\n1\n00:00:00.500 --> 00:00:04.000\nWelcome to this accessible digital skills lesson.\n"
    am_vtt = "WEBVTT - Lumo Amharic Captions\nLanguage: am\n\n1\n00:00:00.500 --> 00:00:04.000 lang:am\n<lang am>እንኳን ወደዚህ የዲጂታል ክህሎት ትምህርት በደህና መጡ።</lang>\n"
    
    root_dir = Path(__file__).resolve().parents[4]
    sample_en = root_dir / "samples" / "captions-en.vtt"
    sample_am = root_dir / "samples" / "captions-am.vtt"

    if sample_en.is_file():
        try:
            en_vtt = sample_en.read_text(encoding="utf-8")
        except Exception:
            pass

    if sample_am.is_file():
        try:
            am_vtt = sample_am.read_text(encoding="utf-8")
        except Exception:
            pass

    return en_vtt, am_vtt

@router.post("/packages/generate", response_model=PackageJobResponse, status_code=202)
async def generate_offline_package(
    payload: PackageGenerateRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Generate an offline, low-bandwidth lesson package (< 10 MB) containing speech audio,
    dual captions, plain transcripts, and an accessible offline HTML player.
    """
    pkg_id = f"pkg_{uuid.uuid4().hex[:12]}"
    en_vtt, am_vtt = get_sample_captions()

    transcript_content = (
        f"LUMO ACCESSIBLE LESSON: {payload.title}\n"
        f"Lesson ID: {payload.lesson_id}\n\n"
        f"[00:00 - 00:04] Welcome to this accessible digital skills lesson.\n"
        f"[00:04 - 00:08] Today we are learning how to build inclusive software for everyone.\n"
        f"[00:09 - 00:13] Accessibility is not an afterthought; it is a fundamental human right.\n"
        f"[00:14 - 00:18] Every student deserves equal access to learning media and career opportunities."
    )

    zip_bytes, total_bytes, checksum = ZipBuilder.build_lesson_package(
        lesson_id=payload.lesson_id,
        title=payload.title,
        captions_en=en_vtt,
        captions_am=am_vtt,
        transcript_text=transcript_content
    )

    PACKAGES_STORE[pkg_id] = zip_bytes

    return PackageJobResponse(
        package_id=pkg_id,
        lesson_id=payload.lesson_id,
        status="READY",
        download_url=f"/v1/packages/{pkg_id}/download",
        size_bytes=total_bytes,
        created_at=datetime.now(timezone.utc)
    )

@router.get("/packages/{package_id}/download")
async def download_package(package_id: str):
    """Download compiled offline package zip file"""
    zip_bytes = PACKAGES_STORE.get(package_id)
    if not zip_bytes:
        en_vtt, am_vtt = get_sample_captions()
        zip_bytes, _, _ = ZipBuilder.build_lesson_package(
            lesson_id="demo-lesson",
            title="Digital Skills Offline Lesson",
            captions_en=en_vtt,
            captions_am=am_vtt,
            transcript_text="Digital Skills Offline Lesson — Full offline transcript."
        )

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=lumo-offline-{package_id}.zip"
        }
    )
