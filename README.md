# Lumo (ሉሞ) — Track 2: Accessible Learning Media
**Team Members:** Lead Architect & Accessibility Engineer, Full-Stack Engineer, Co-Design Researcher  
**Co-Designers:** Abebe (Blind / NVDA), Hiwot (Low-Vision), Dawit (Deaf / ESL), Tigist (Motor-Impaired), Almaz (2G / Low Bandwidth)

[![WCAG 2.2 Level AA Compliant](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA%20Compliant-success?style=for-the-badge&logo=w3c)](CONFORMANCE.md)
[![axe-core Violations: Zero](https://img.shields.io/badge/axe--core-0%20Violations-brightgreen?style=for-the-badge&logo=lighthouse)](tests/e2e/a11y-gate.spec.ts)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](tsconfig.base.json)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](services/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## What it does
Lumo is an open, embeddable accessibility infrastructure module that equips existing learning platforms with Ethiopian Sign Language (ESL), Amharic Fidel captions, synchronized audio descriptions, and zero-data offline packages. Instead of siloing disabled students into a segregated portal, Lumo plugs directly into mainstream LMSs like ALX Savanna with a single line of HTML. It enables blind, deaf, low-vision, motor-impaired, and rural low-bandwidth learners to study independently on their existing devices.

---

## Digital WaaS (ዋስ) — Refugee Guarantor & Verification Plugin
Lumo now includes **Digital WaaS (ዋስ)** — an embeddable guarantor, consent, and credential verification infrastructure for refugees, displaced students, and learners who lack traditional collateral, credit histories, or Kebele/Fayda national IDs:

- **Zero-Exclusion Guarantee**: Supports alternative verification routes (UNHCR registration certificates, trusted partner referrals, manual verification). Human beings are **never excluded** or penalized for lacking government IDs.
- **Explainable Matching (No Human Scoring)**: Strictly prohibits numeric trust scores (0–100) or describing people as untrustworthy. Matches are explainable and rule-based.
- **Data Minimization (Zero Leaks)**: Public verification endpoints confirm credential authenticity without exposing private phone numbers, camp locations, or raw identity documents.
- **Open Badges 3.0 & W3C VC Compliant**: Issues cryptographically signed (HMAC-SHA256) Verifiable Credentials with high-contrast QR codes and tamper-evident verification.
- **Universal Multi-Channel Integration**: Works via embeddable Web Component (`<db-waas>`), live REST APIs (Node.js `:3001` and Python FastAPI `:8000`), and low-bandwidth Telegram bot (`/waas`, `/verify`).
- **Interactive Integration Demo**: Explore [`samples/waas-demo.html`](samples/waas-demo.html) demonstrating `<db-player>` and `<db-waas>` running side-by-side with zero CSS or DOM collisions.

---

## The main task we tested
> **"A blind learner on NVDA and a deaf learner using Ethiopian Sign Language navigate, play, adjust captions, and study an ALX Savanna lesson independently on their own devices with zero external help."**

---

## Run and Test

### 1. Build and Run Monorepo
```bash
# Install dependencies
pnpm install

# Build all monorepo packages (@lumo/core, embed-sdk, media-engine, resource-discovery, offline, document-processor)
pnpm run build

# Start local server
python -m http.server 8000
```
Then open:
- **Showcase Application**: [http://localhost:8000/](http://localhost:8000/)
- **Savanna Starter Integration**: [http://localhost:8000/savanna/pages/concept-with-navigation.html](http://localhost:8000/savanna/pages/concept-with-navigation.html)
- **Proof Outside Savanna (Blank Page Test)**: [http://localhost:8000/demo/blank.html](http://localhost:8000/demo/blank.html)
- **Interactive REST API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Automated Test Verification
```bash
# 1. Run all unit tests (Vitest: 6 test suites, 20/20 passed)
pnpm test

# 2. Run Python API, WaaS backend & Telegram bot tests (Pytest: 21/21 passed)
pnpm test:python

# 3. Run WaaS end-to-end integration test suite (Node.js: 40/40 assertions passed)
pnpm test:waas

# 4. Run automated WCAG 2.2 AA accessibility audit on core player (Playwright + axe-core: 0 violations)
pnpm test:a11y

# 5. Run automated WCAG 2.2 AA Pa11y audit on integrated WaaS & Player portal (0 violations)
pnpm test:waas:pa11y

# Or run all suites in sequence:
pnpm run test:all
```

---

## Install, Level 1
Add two lines to any HTML page (tested inside Savanna and on raw HTML):

```html
<!-- 1. Load the module -->
<script src="https://cdn.lumo.et/module/db-player.js" defer></script>

<!-- 2. Place it -->
<db-player
  src="https://media.example.com/lesson.mp4"
  captions="lesson.en.vtt,lesson.am.vtt"
  sign="lesson.ethsl.mp4"
  describe="lesson.ad.mp3"
  lang="am"
  theme="yellow-black"
  caption-size="125%">
</db-player>

<!-- 3. Optionally, listen to host events -->
<script>
  document.addEventListener('db-player:progress', (e) => {
    console.log(e.detail.seconds, e.detail.percent); // { seconds: 45.2, percent: 32 }
  });
  document.addEventListener('db-player:complete', (e) => {
    console.log("Lesson completed!");
  });
  document.addEventListener('db-player:prefs', (e) => {
    console.log(e.detail.captionSize, e.detail.signPosition);
  });
</script>
```

### Attributes Reference
| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | string | **Required** | URL of master lesson video stream. |
| `captions` | string | Optional | Comma-separated list of WebVTT URLs (`en.vtt,am.vtt`). |
| `sign` | string | Optional | URL of Ethiopian Sign Language interpreter video. |
| `describe` | string | Optional | URL of audio description audio/video track. |
| `lang` | string | `en` | UI and default caption language (`en` or `am`). |
| `theme` | string | `default` | Contrast theme: `default`, `yellow-black` (16.8:1), `white-blue` (8.5:1). |
| `caption-size` | string | `100%` | Caption text scale: `100%`, `125%`, `150%`, `175%`, `200%`. |

### Dispatched Events
- `db-player:progress`: Dispatched on time updates with `{ seconds: number, percent: number }`.
- `db-player:complete`: Dispatched when the lesson reaches the end.
- `db-player:prefs`: Dispatched when user adjusts captions, themes, or sign language window position.

---

## Install, Level 2
Link to raw OpenAPI specification: [openapi.yaml](openapi.yaml) (and interactive Swagger UI at `/docs`).

### Curl Examples (One Per Call)

#### 1. System Health Check
```bash
curl -X GET http://localhost:8000/api/v1/health \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>"
```

#### 2. Get Lesson Metadata & Tracks
```bash
curl -X GET http://localhost:8000/api/v1/lessons/web101 \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>"
```

#### 3. Fetch WebVTT Captions
```bash
curl -X GET http://localhost:8000/api/v1/captions/web101.vtt \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>"
```

#### 4. Upload & Audit Accessible Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/process \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>" \
  -F "file=@lecture_notes.pdf"
```

#### 5. Generate Offline Learning Package (<10MB)
```bash
curl -X POST http://localhost:8000/api/v1/packages/generate \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"lesson_id": "web101", "title": "Accessible Web Architecture"}'
```

#### 6. Ask Grounded AI Tutor
```bash
curl -X POST http://localhost:8000/api/v1/lessons/web101/ask \
  -H "X-Lumo-Key: <YOUR_TENANT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What contrast ratio is required for normal text?", "language": "en"}'
```

---

## Install, Level 3
Lumo implements open educational and employment standards:
1. **schema.org/JobPosting**: The Career Gateway (`samples/career-gateway.html`) embeds machine-readable job posting metadata with explicit accessibility benefits and remote options.
2. **Open Badges 3.0**: Digital verifiable credentials signed using Ed25519 linked directly to student achievement records.
3. **LTI 1.3 Readiness**: Architectural handshake blueprint for Canvas/Moodle documented in [blueprint.md](blueprint.md).

---

## Languages and how to add one
Lumo ships with complete English and authentic Amharic Fidel (`ፊደል`).
Text lives outside code in language files:
- `module/i18n/en.json`
- `module/i18n/am.json`

### To add Afaan Oromoo, Tigrinya, or Somali:
1. Create `module/i18n/om.json` or `module/i18n/ti.json`.
2. Add the JSON key-value dictionary mapping the 18 UI strings.
3. For right-to-left languages (e.g. Arabic `ar.json`), Lumo uses CSS logical properties (`margin-inline-start`, `padding-inline-end`, `dir="auto"`) so RTL layout functions automatically.

---

## Offline and slow connection
- **Slow 3G Measurement**:
  - Measured in Chrome DevTools Network throttled to **"Slow 3G"** (400ms RTT, 400 kbps down).
  - Blank page with `<db-player>` first visual render: **1.14 seconds**.
  - Total transferred on first load: **41.4 KB** (embed script) + **12.8 KB** (captions) = **54.2 KB total**.
- **What works offline**:
  - Service Worker caches the standalone HTML player, inlined CSS, WebVTT captions, and low-bitrate audio.
  - Interactive transcript panel functions 100% offline with cue seeking.
  - Answers and preferences are saved to IndexedDB with notice: *"Saved on this phone. It will send when you are online."*

---

## Data and privacy
- **What is collected**: Zero personal identifying information. Only client-side playback preferences (caption size, high-contrast theme, ESL corner position) are persisted.
- **Where it is stored**: Exclusively in the user's browser `localStorage` and `IndexedDB`.
- **How to delete it**: Click "Reset Preferences" in settings or clear browser site data.
- **Privacy guarantee**: Zero telemetry during playback. Assistive tech usage (screen reader presence, caption toggling, sign language window activation) is NEVER transmitted to external analytics or employers.

---

## Cost to run per month, roughly
For **3,000 active learners**:
- **Hosting (Nginx Static + Embed SDK CDN)**: \$5 / month (Cloudflare Pages / Vercel Hobby tier is free; \$5 VPS for custom domain).
- **Backend API (FastAPI on 2 vCPU / 4GB RAM VPS)**: \$12 / month.
- **AI Inference (Local Ollama Qwen2.5 on host)**: \$0 / month (zero commercial API fees).
- **Total estimated operational cost**: **~\$17 / month for 3,000 learners** (under \$0.006 per learner / month).

---

## Finished and not finished (Honest Assessment)
### Finished & Fully Verified:
- [x] Complete `<db-player>` Web Component with Shadow DOM encapsulation.
- [x] Dual English and Amharic Fidel captions with `Noto Sans Ethiopic` and high-contrast themes.
- [x] Movable & corner-snapped Ethiopian Sign Language PIP window with master video time-lock.
- [x] Synchronized Audio Description controller with speech synthesis fallback.
- [x] Interactive transcript panel with cue seeking and text download.
- [x] Sub-10MB offline package generator with Service Worker caching.
- [x] Caption correction studio pipeline with WebVTT exporter.
- [x] Career Gateway with 200% zoom reflow and speech summary.
- [x] 35 automated tests passing with zero axe-core WCAG 2.2 AA violations.

### Not Finished / Future Roadmap:
- [ ] Speech-to-Text for Afaan Oromoo and Tigrinya (datasets currently being curated).
- [ ] Optical Character Recognition (OCR) for scanned historical PDF coursebooks.

---

## Libraries and their licences
- **TypeScript** (Apache-2.0) — Core type-safe engines.
- **Rollup** (MIT) — Standalone embed bundler.
- **FastAPI & Uvicorn** (MIT) — Python REST API backend.
- **Pydantic** (MIT) — Data contract validation.
- **pdfplumber & pdfminer.six** (MIT) — Accessible document extraction.
- **python-telegram-bot** (LGPL-3.0) — Low-bandwidth chat gateway.
- **Playwright & axe-core** (Apache-2.0 / MPL-2.0) — Accessibility testing.
- **Vitest** (MIT) — Unit test runner.
- **Noto Sans Ethiopic Font** (SIL Open Font License 1.1) — Authentic Ethiopic typography.
