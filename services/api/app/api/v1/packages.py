from fastapi import APIRouter, Depends, Response, HTTPException
from datetime import datetime, timezone
import uuid
from app.schemas.packages import PackageGenerateRequest, PackageJobResponse
from app.core.security import verify_api_key
from app.services.zip_builder import ZipBuilder

router = APIRouter()

PACKAGES_STORE = {}

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

    sample_en = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:05.000\nWelcome to this lesson.\n"
    sample_am = "WEBVTT\nLanguage: am\n\n1\n00:00:01.000 --> 00:00:05.000 lang:am\n<lang am>እንኳን ወደዚህ ትምህርት በደህና መጡ።</lang>\n"

    zip_bytes, total_bytes, checksum = ZipBuilder.build_lesson_package(
        lesson_id=payload.lesson_id,
        title=payload.title,
        captions_en=sample_en,
        captions_am=sample_am,
        transcript_text=f"{payload.title}\n\n1. Introduction to topic.\n2. Key concepts and practice."
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
        # Build default on-the-fly for demo
        zip_bytes, _, _ = ZipBuilder.build_lesson_package(
            lesson_id="demo-lesson",
            title="Digital Skills Offline Lesson"
        )

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=lumo-offline-{package_id}.zip"
        }
    )
