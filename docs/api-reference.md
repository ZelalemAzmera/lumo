# Lumo REST API Reference (v1)

The Lumo API provides programmatically accessible endpoints for automated caption generation, document structure analysis, offline package creation, and transcript-grounded AI tutoring.

- **Base URL**: `http://localhost:8000/api/v1`
- **Specification**: OpenAPI 3.1.0 (`/docs` or `/openapi.json`)
- **Authentication**: `X-Lumo-Key: <api_key>` header (Default development key: `lumo_dev_key_2026`)

---

## 1. System Health & Readiness

### `GET /health`
Verifies API status, version, and local AI provider connection.

```bash
curl -X GET http://localhost:8000/api/v1/health \
  -H "X-Lumo-Key: lumo_dev_key_2026"
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_provider": "local_ollama",
  "whisper_available": true
}
```

---

## 2. Captions & Transcripts

### `POST /captions/generate`
Generates WebVTT captions from an uploaded audio/video file using OpenAI Whisper or local fine-tuned CTC model for Amharic.

```bash
curl -X POST http://localhost:8000/api/v1/captions/generate \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  -F "file=@audio_sample.mp3" \
  -F "language=en" \
  -F "lesson_id=web101"
```

**Response (200 OK):**
```json
{
  "lesson_id": "web101",
  "language": "en",
  "vtt_url": "/api/v1/captions/web101.vtt",
  "cues_count": 4,
  "duration_seconds": 18.0
}
```

### `GET /captions/{lesson_id}.vtt`
Retrieves the raw WebVTT caption file for a lesson.

```bash
curl -X GET http://localhost:8000/api/v1/captions/web101.vtt \
  -H "X-Lumo-Key: lumo_dev_key_2026"
```

**Response (200 OK with `text/vtt`):**
```text
WEBVTT

00:00:00.000 --> 00:00:04.000
Welcome to Lumo Accessible Learning Media.

00:00:04.000 --> 00:00:09.000
Web accessibility ensures equitable education for all learners.
```

---

## 3. Accessible Document Processing

### `POST /documents/process`
Audits uploaded PDF documents for structural accessibility barriers (heading level hierarchy skips, missing table headers, missing image alt text).

```bash
curl -X POST http://localhost:8000/api/v1/documents/process \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  -F "file=@lecture_notes.pdf"
```

**Response (200 OK):**
```json
{
  "filename": "lecture_notes.pdf",
  "extracted_text": "Sample lecture notes content...",
  "heading_count": 5,
  "tables_found": 1,
  "images_missing_alt": 0,
  "accessibility_issues": [
    "Skipped heading level: h1 to h3 without an intervening h2"
  ],
  "wcag_compliant": false
}
```

---

## 4. Offline Learning Packages

### `POST /packages/generate`
Generates a self-contained offline learning zip archive (< 10 MB) containing an offline HTML5 player, embedded stylesheets, and local captions.

```bash
curl -X POST http://localhost:8000/api/v1/packages/generate \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "web101",
    "title": "Introduction to Web Accessibility",
    "html_body": "<h1>Introduction</h1><p>Accessible web principles.</p>"
  }'
```

**Response (200 OK):**
```json
{
  "package_id": "pkg-web101-9f2b",
  "lesson_id": "web101",
  "download_url": "/api/v1/packages/pkg-web101-9f2b/download",
  "size_bytes": 128450,
  "sha256_checksum": "a8f3b2c89...d4e8",
  "created_at": "2026-11-14T14:00:00Z"
}
```

### `GET /packages/{package_id}/download`
Downloads the binary zip package file.

```bash
curl -X GET http://localhost:8000/api/v1/packages/pkg-web101-9f2b/download \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  --output package.zip
```

---

## 5. Lessons & Source-Grounded AI Tutor

### `GET /lessons/{lesson_id}`
Retrieves lesson metadata, available accessibility tracks, and duration.

```bash
curl -X GET http://localhost:8000/api/v1/lessons/web101 \
  -H "X-Lumo-Key: lumo_dev_key_2026"
```

**Response (200 OK):**
```json
{
  "lesson_id": "web101",
  "title": "Accessible Web Architecture — WEB101",
  "description": "Core principles of semantic HTML, WCAG 2.2 AA contrast compliance, Web Components, and offline resilience.",
  "duration_seconds": 360,
  "languages_supported": ["en", "am"],
  "has_audio_description": true,
  "has_sign_language": true,
  "transcript_summary": "Covers HTML semantics, contrast guidelines (4.5:1), Shadow DOM encapsulation, and offline caching via Service Workers.",
  "video_url": "/media/web101/main.mp4"
}
```

### `POST /lessons/{lesson_id}/ask`
Queries the source-grounded RAG AI tutor. Strictly constrained to the lesson transcript with exact timestamp citations.

```bash
curl -X POST http://localhost:8000/api/v1/lessons/web101/ask \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What contrast ratio is required for normal text?",
    "language": "en"
  }'
```

**Response (200 OK):**
```json
{
  "answer": "According to the lesson transcript, normal text must maintain a contrast ratio of at least 4.5:1 against its background to satisfy WCAG 2.2 Level AA requirements.",
  "citations": [
    {
      "timestamp_start": "00:00:10",
      "timestamp_end": "00:00:15",
      "excerpt": "CSS delivers the presentation layer, but must always preserve sufficient contrast ratios of at least 4.5:1."
    }
  ],
  "confidence_score": 0.96,
  "source": "transcript_grounded"
}
```
