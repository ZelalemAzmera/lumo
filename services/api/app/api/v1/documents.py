from fastapi import APIRouter, Depends, UploadFile, File, Form, Response, HTTPException
from datetime import datetime, timezone
import uuid
from app.schemas.documents import DocumentProcessResponse
from app.core.security import verify_api_key
from app.services.pdf_extractor import PDFExtractor
from app.services.html_generator import HTMLGenerator

router = APIRouter()

DOCUMENTS_STORE = {}

@router.post("/documents/process", response_model=DocumentProcessResponse, status_code=202)
async def process_document(
    file: UploadFile = File(...),
    title: str = Form("Course Document"),
    lang: str = Form("en"),
    api_key: str = Depends(verify_api_key)
):
    """
    Upload a course document (PDF or text) to generate accessible, screen-reader ready HTML.
    """
    content_bytes = await file.read()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    sections, flags = PDFExtractor.extract_structure(content_bytes)
    accessible_html = HTMLGenerator.generate_accessible_html(title=title, sections=sections, lang=lang)

    DOCUMENTS_STORE[doc_id] = accessible_html

    return DocumentProcessResponse(
        document_id=doc_id,
        status="COMPLETED",
        accessible_html_url=f"/v1/documents/{doc_id}/html",
        flags=flags,
        metrics={
            "sections_extracted": len(sections),
            "headings_created": len([s for s in sections if s.get("heading")]),
            "flags_detected": len(flags)
        },
        created_at=datetime.now(timezone.utc)
    )

@router.get("/documents/{document_id}/html")
async def get_accessible_html(document_id: str):
    """Retrieve rendered accessible HTML document"""
    html = DOCUMENTS_STORE.get(document_id)
    if not html:
        # Fallback demonstration document
        html = HTMLGenerator.generate_accessible_html(
            title="Sample Accessible Document",
            sections=[
                {"level": 2, "heading": "Introduction", "content": "This document has been remediated for screen readers."}
            ]
        )
    return Response(content=html, media_type="text/html")
