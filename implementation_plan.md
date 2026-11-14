# Implementation Plan: Lumo — Accessible Learning Media Module
## Digital Bridge Accessibility Hackathon 2026 · Track 2

**Version:** 1.0 · **Date:** 14 November 2026  
**Status:** Planning & Engineering Blueprint Implementation Guide  
**Derived From:** `blueprint.md` (v1.0)  
**Classification:** Engineering Specification, Execution Roadmap & Operational Manual  

---

## Table of Contents

1. [Implementation Philosophy](#1-implementation-philosophy)
2. [Repository Structure](#2-repository-structure)
3. [Development Phases Overview](#3-development-phases-overview)
4. [Detailed Implementation Tasks (Phases 0–15)](#4-detailed-implementation-tasks-phases-015)
   - [Phase 0: Research & Environment Verification](#phase-0-research--environment-verification)
   - [Phase 1: Core Architecture, Shared Contracts & TypeScript Interfaces](#phase-1-core-architecture-shared-contracts--typescript-interfaces)
   - [Phase 2: Accessible Media Player Component](#phase-2-accessible-media-player-component)
   - [Phase 3: Caption & Transcript Engine](#phase-3-caption--transcript-engine)
   - [Phase 4: Ethiopian Sign Language (ESL) Window](#phase-4-ethiopian-sign-language-esl-window)
   - [Phase 5: Audio Description Engine](#phase-5-audio-description-engine)
   - [Phase 6: Accessible Document Processing](#phase-6-accessible-document-processing)
   - [Phase 7: Offline Learning Packages](#phase-7-offline-learning-packages)
   - [Phase 8: JavaScript Embed SDK](#phase-8-javascript-embed-sdk)
   - [Phase 9: REST API & OpenAPI](#phase-9-rest-api--openapi)
   - [Phase 10: Savanna Platform Integration](#phase-10-savanna-platform-integration)
   - [Phase 11: Web Demonstration Application](#phase-11-web-demonstration-application)
   - [Phase 12: AI Educator (Optional Capability)](#phase-12-ai-educator-optional-capability)
   - [Phase 13: Accessibility & Real-User Validation](#phase-13-accessibility--real-user-validation)
   - [Phase 14: Documentation & One-Hour Integration Challenge](#phase-14-documentation--one-hour-integration-challenge)
   - [Phase 15: Telegram Bot Architecture (Future Phase)](#phase-15-telegram-bot-architecture-future-phase)
5. [API Implementation Plan](#5-api-implementation-plan)
6. [Embed SDK Implementation Plan](#6-embed-sdk-implementation-plan)
7. [Data & Database Implementation](#7-data--database-implementation)
8. [AI Implementation Plan](#8-ai-implementation-plan)
9. [Offline Implementation Plan](#9-offline-implementation-plan)
10. [Testing Strategy & Automated Gates](#10-testing-strategy--automated-gates)
11. [Real-User Testing Protocol](#11-real-user-testing-protocol)
12. [Savanna Integration Walkthrough](#12-savanna-integration-walkthrough)
13. [Web Implementation Plan](#13-web-implementation-plan)
14. [Telegram Bot Implementation Plan](#14-telegram-bot-implementation-plan)
15. [Documentation Plan](#15-documentation-plan)
16. [Deployment & Operations](#16-deployment--operations)
17. [Risk Register & Contingency Playbook](#17-risk-register--contingency-playbook)
18. [Prioritization Matrix (P0 / P1 / P2 / P3)](#18-prioritization-matrix-p0--p1--p2--p3)
19. [Final Delivery Checklist & Judging Alignment](#19-final-delivery-checklist--judging-alignment)

---

## 1. Implementation Philosophy

Lumo's engineering lifecycle is governed by six inviolable core tenets. Any code, architecture, or design that violates these principles is rejected at review:

### 1.1 Architecture-First
No ad-hoc component creation. Every UI element, state store, and network boundary is defined in strict TypeScript interfaces and OpenAPI schemas before execution. Boundary contracts prevent coupling between the host platform and Lumo modules.

### 1.2 Accessibility-First (Non-Negotiable Gate)
Accessibility is not an afterthought, a polish sprint, or an overlay. Every component is developed starting with keyboard navigation, WAI-ARIA states, and screen-reader announcements. Automated `axe-core` assertions run on every pull request. A component that fails automated accessibility testing or lacks ARIA documentation is deemed broken regardless of visual appearance.

### 1.3 Integration-First (The Anti-Walled-Garden Rule)
Lumo is an open infrastructure module, not a standalone destination. "Not a special app. The one everyone uses, made to work for everyone." Our primary target is zero-friction injection into host static environments (such as ALX Savanna) via a single `<script>` tag, without requiring bundlers, node modules, or host framework rebuilds.

### 1.4 Progressive Enhancement & Graceful Degradation
The core player functions as a standards-compliant HTML5 video player even if JavaScript is partially restricted or fails. Features layer progressively:
1. Native `<video>` / `<audio>` fallback
2. Custom accessible ARIA controls and WebVTT rendering
3. Floating ESL overlay and Audio Description tracks
4. Service Worker offline caching
5. AI Educator conversational interface (opt-in only)

### 1.5 Low-Bandwidth & Resource-Constrained Engineering
Designed specifically for the Ethiopian hardware reality: low-cost Android smartphones (Tecno, Samsung A-series with 1–3 GB RAM), Android 8+, and volatile 2G/3G connectivity. 
- Maximum core SDK bundle size: **< 40 KB gzipped**.
- Offline learning package budget: **< 10 MB per lesson** (speech-optimized 64kbps MP3 audio, accessible HTML, VTT).
- Zero external font render-blocking; CSS containment to eliminate layout thrashing.

### 1.6 Privacy by Architecture ("Nothing Leaves Without Consent")
Core accessibility modules execute 100% client-side in the browser. Zero telemetry, zero tracking, zero heartbeat calls to remote servers during video playback, caption rendering, or ESL viewing. Network egress occurs only during explicit user-initiated actions (downloading an offline package, submitting a PDF for remediation, or asking the AI Educator).

---

## 2. Repository Structure

Lumo is structured as a pnpm monorepo. This provides modular independence, clear separation of concerns, fast builds, and clean dependency boundaries:

```
lumo/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint, unit tests, build, axe-core automated gate
│       ├── release.yml                # Semantic release, CDN bundle upload, Docker push
│       └── a11y-audit.yml             # Scheduled Playwright + axe-core audit
├── apps/
│   ├── web/                           # Next.js 14 (App Router) reference demonstration app
│   │   ├── app/
│   │   │   ├── (marketing)/page.tsx   # Landing page & value proposition
│   │   │   ├── demo/
│   │   │   │   ├── page.tsx           # Comprehensive multi-module demo
│   │   │   │   ├── player/page.tsx    # Standalone Player module demo
│   │   │   │   ├── captions/page.tsx  # Dual English/Amharic caption demo
│   │   │   │   ├── esl/page.tsx       # Movable ESL window demo
│   │   │   │   ├── offline/page.tsx   # Offline package download simulator
│   │   │   │   └── documents/page.tsx # PDF to accessible HTML demo
│   │   │   ├── jobs/page.tsx          # Accessible job card (Career Gateway)
│   │   │   ├── docs/                  # Developer & integration documentation
│   │   │   └── api-docs/page.tsx      # Swagger UI / Redoc OpenAPI explorer
│   │   ├── components/                # Demo-specific UI components (Tailwind CSS)
│   │   ├── public/samples/            # Sample videos, VTT captions, PDFs, audio
│   │   └── package.json
│   └── telegram-bot/                  # Future Phase: Python Telegram bot (aiogram 3.x)
│       ├── bot/
│       │   ├── handlers/              # /lesson, /caption, /ask, /offline
│       │   ├── middlewares/           # A11y text formatting, rate limiting
│       │   └── main.py
│       └── requirements.txt
├── packages/
│   ├── core/                          # Vanilla TypeScript core player & accessibility logic
│   │   ├── src/
│   │   │   ├── player/
│   │   │   │   ├── LumoPlayer.ts      # Web Component custom element definition
│   │   │   │   ├── StateMachine.ts    # Finite state machine (PLAYING, PAUSED, etc.)
│   │   │   │   ├── KeyboardHandler.ts # Global & element keyboard shortcut map
│   │   │   │   └── Announcer.ts       # ARIA live region polite screen-reader announcer
│   │   │   ├── captions/
│   │   │   │   ├── VTTParser.ts       # WebVTT parser supporting cue timings & styles
│   │   │   │   ├── CaptionRenderer.ts # Custom styled overlay renderer (Noto Sans Ethiopic)
│   │   │   │   └── TranscriptSync.ts  # Synchronized interactive transcript controller
│   │   │   ├── esl/
│   │   │   │   ├── ESLWindow.ts       # Draggable, resizable, accessible dialog window
│   │   │   │   ├── VideoSync.ts       # Main video <-> ESL video clock synchronization
│   │   │   │   └── TouchDrag.ts       # Pointer & touch event gesture controller
│   │   │   ├── audio-description/
│   │   │   │   ├── ADController.ts    # Dual-source video switcher with time preservation
│   │   │   │   └── TextADFallback.ts  # WebVTT text description screen-reader dispatcher
│   │   │   ├── styles/
│   │   │   │   ├── player.css         # Scoped Shadow DOM styles (contrast AA verified)
│   │   │   │   ├── captions.css       # Ethiopic typography, sizing, color presets
│   │   │   │   └── esl.css            # Floating window, handles, focus rings
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── embed-sdk/                     # Rollup / ESBuild pipeline producing single `lumo.min.js`
│   │   ├── src/
│   │   │   ├── index.ts               # Auto-registers <lumo-player> on window load
│   │   │   └── loader.ts              # Dynamic font preloader (Noto Sans Ethiopic)
│   │   ├── rollup.config.js           # Bundle optimizer: treeshaking, terser, CSS inlining
│   │   └── package.json
│   ├── offline/                       # Service Worker, Cache API & IndexedDB manager
│   │   ├── src/
│   │   │   ├── sw.ts                  # Service Worker lifecycle & stale-while-revalidate
│   │   │   ├── IDBStore.ts            # IndexedDB typed schema wrapper (idb library)
│   │   │   ├── PackageDownloader.ts   # Stream downloader, SHA-256 verifier, unpacker
│   │   │   └── OfflinePlayer.ts       # Lightweight audio-first HTML fallback player
│   │   └── package.json
│   ├── document-processor/            # Client-side validation & utilities for documents
│   │   ├── src/
│   │   │   ├── HTMLSanitizer.ts       # Strict DOMPurify wrapper for transformed documents
│   │   │   └── TagChecker.ts          # Validates semantic tags (h1-h6, table headers, alt)
│   │   └── package.json
│   └── ai-educator/                   # Optional RAG & conversational learning client
│       ├── src/
│       │   ├── ChatController.ts      # Conversational streaming client
│       │   ├── TranscriptRAG.ts       # In-memory transcript chunker & keyword search
│       │   └── UI/                    # Accessible chat widget (role="log", keyboard trap safe)
│       └── package.json
├── services/
│   ├── api/                           # FastAPI backend service (Python 3.11)
│   │   ├── app/
│   │   │   ├── api/v1/                # Endpoint routers
│   │   │   │   ├── captions.py        # POST /captions/generate, GET /captions/{id}
│   │   │   │   ├── documents.py       # POST /documents/process, GET /documents/{id}
│   │   │   │   ├── packages.py        # POST /packages/generate, GET /packages/{id}/download
│   │   │   │   ├── lessons.py         # POST /lessons/{id}/ask (AI Q&A)
│   │   │   │   ├── lti.py             # LTI 1.3 configuration & launch handler
│   │   │   │   └── health.py          # GET /health
│   │   │   ├── core/                  # Config, security, database session, telemetry
│   │   │   ├── models/                # SQLAlchemy ORM models (PostgreSQL)
│   │   │   ├── schemas/               # Pydantic v2 validation models
│   │   │   ├── services/              # Business logic (Storage, DocumentParser, AI)
│   │   │   └── main.py
│   │   ├── tests/                     # Pytest suite (unit + endpoint integration)
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   └── requirements.txt
│   └── media-processor/               # Async worker queue (Celery + Redis / BackgroundTasks)
│       ├── workers/
│       │   ├── audio_extractor.py     # ffmpeg MP3 extraction (64kbps CBR speech)
│       │   ├── pdf_converter.py       # pdfminer.six + pdfplumber semantic structure extractor
│       │   └── zip_builder.py         # Deterministic offline package builder
│       └── Dockerfile
├── docs/                              # Project documentation & integration guides
│   ├── quick-start.md                 # 5-minute integration guide (< 500 words)
│   ├── savanna-integration.md         # Step-by-step Savanna static pages injection guide
│   ├── api-reference.md               # REST API & OpenAPI specification guide
│   ├── accessibility-statement.md     # WCAG 2.2 AA conformance claim & methodology
│   ├── privacy-policy.md              # Data minimization & zero-telemetry commitment
│   └── one-hour-challenge.md          # Timed judge evaluation walkthrough
├── tests/                             # End-to-end integration & accessibility test suites
│   ├── e2e/                           # Playwright test specs
│   │   ├── player-controls.spec.ts    # Keyboard navigation & playback verification
│   │   ├── captions-amharic.spec.ts   # Ethiopic rendering & font validation
│   │   ├── esl-window.spec.ts         # Drag, resize, keyboard dialog behavior
│   │   └── offline-cache.spec.ts      # Service worker offline interception test
│   ├── a11y/                          # Automated axe-core scanning
│   │   ├── axe-player.spec.ts         # axe-core scan of <lumo-player> in all states
│   │   └── wcag-audit.ts              # 200% zoom, color contrast, focus order audits
│   └── screenreader-scripts/          # Manual NVDA & TalkBack verification scripts
│       ├── nvda-desktop-script.md
│       └── talkback-android-script.md
├── docker-compose.yml                 # Local & production multi-container orchestration
├── package.json                       # Monorepo root scripts & dev dependencies
├── pnpm-workspace.yaml
└── README.md                          # Main repository overview & onboarding
```

---

## 3. Development Phases Overview

The execution roadmap is structured into 16 sequential, dependency-aware phases (Phases 0 through 15). Each phase produces testable, verifiable artifacts before the subsequent phase commences:

```mermaid
flowchart TD
    P0["Phase 0: Research & Environment Verification"] --> P1["Phase 1: Core Architecture & Shared Contracts"]
    P1 --> P2["Phase 2: Accessible Media Player Component"]
    P2 --> P3["Phase 3: Caption & Transcript Engine"]
    P3 --> P4["Phase 4: ESL Window Overlay"]
    P3 --> P5["Phase 5: Audio Description Engine"]
    P2 --> P6["Phase 6: Accessible Document Processing"]
    P3 & P5 --> P7["Phase 7: Offline Learning Packages"]
    P2 & P3 & P4 & P5 & P7 --> P8["Phase 8: JavaScript Embed SDK"]
    P6 & P7 --> P9["Phase 9: REST API & OpenAPI"]
    P8 --> P10["Phase 10: Savanna Platform Integration"]
    P8 & P9 --> P11["Phase 11: Web Demonstration Application"]
    P11 --> P12["Phase 12: Optional AI Educator Experience"]
    P10 & P11 --> P13["Phase 13: Accessibility & Real-User Validation"]
    P13 --> P14["Phase 14: Documentation & One-Hour Challenge"]
    P9 & P11 --> P15["Phase 15: Telegram Bot (Future Phase)"]

    style P0 fill:#2d3748,stroke:#4a5568,color:#fff
    style P1 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P2 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P3 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P4 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P5 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P6 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P7 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P8 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P9 fill:#2b6cb0,stroke:#3182ce,color:#fff
    style P10 fill:#319795,stroke:#38b2ac,color:#fff
    style P11 fill:#319795,stroke:#38b2ac,color:#fff
    style P12 fill:#805ad5,stroke:#9f7aea,color:#fff
    style P13 fill:#c53030,stroke:#e53e3e,color:#fff
    style P14 fill:#319795,stroke:#38b2ac,color:#fff
    style P15 fill:#718096,stroke:#a0aec0,color:#fff
```

---

## 4. Detailed Implementation Tasks (Phases 0–15)

### Phase 0: Research & Environment Verification

#### 1. Objective
Verify all local build tooling, browser test environments, screen readers, Ethiopian script typography constraints, and accessibility automation tools before writing code.

#### 2. Prerequisites
Node.js 20+ LTS, pnpm 9+, Python 3.11+, Git, Google Chrome, NVDA (Windows) or TalkBack (Android test device).

#### 3. Exact Tasks
- [ ] Task 0.1: Initialize Git repository and enforce `.gitignore` (ignoring `.env`, `node_modules`, `dist`, `.venv`).
- [ ] Task 0.2: Configure pnpm workspace and root `package.json` with Turborepo or root build scripts.
- [ ] Task 0.3: Install and verify Playwright with `@axe-core/playwright`.
- [ ] Task 0.4: Verify Noto Sans Ethiopic font availability from Google Fonts CDN; inspect glyph rendering for Fidel characters across Chrome and Firefox.
- [ ] Task 0.5: Verify Python 3.11 virtual environment with FastAPI, Pydantic v2, and Pytest.
- [ ] Task 0.6: Inspect `alx-africa/Savanna-static-pages` repository structure; verify DOM hierarchy and existing media containers.

#### 4. Files & Modules Expected
- `pnpm-workspace.yaml`
- `package.json`
- `tsconfig.base.json`
- `.editorconfig`
- `.prettierrc`

#### 5. Technical Approach
Zero-dependency root with strict TypeScript configurations (`strict: true`, `noImplicitAny: true`, `target: ES2022`).

#### 6. Unit & Integration Tests
- Script to execute `pnpm -v`, `python --version`, and `playwright --version`.
- Smoke test verifying Playwright loads a blank page and executes `axe-core`.

#### 7. Acceptance Criteria & Definition of Done
- All development dependencies install cleanly with zero peer dependency warnings.
- Playwright launches headless Chromium and executes a passing accessibility assertion.

---

### Phase 1: Core Architecture, Shared Contracts & TypeScript Interfaces

#### 1. Objective
Establish the immutable type definitions, event interfaces, and configuration schemas shared across all packages.

#### 2. Prerequisites
Phase 0 complete.

#### 3. Exact Tasks
- [ ] Task 1.1: Define `LumoPlayerConfig` interface in `packages/core/src/types/config.ts`.
- [ ] Task 1.2: Define `CaptionTrack`, `WebVTTNode`, and `Cue` models.
- [ ] Task 1.3: Define `ESLConfig` and window positioning coordinates model.
- [ ] Task 1.4: Define `AudioDescriptionMode` and event contracts.
- [ ] Task 1.5: Define Custom Event schemas (`LumoPlayEvent`, `LumoCaptionChangeEvent`, `LumoOfflineStatusEvent`).
- [ ] Task 1.6: Implement ARIA live region `Announcer` singleton class in `packages/core/src/player/Announcer.ts`.

#### 4. Files & Modules Expected
- `packages/core/src/types/config.ts`
- `packages/core/src/types/events.ts`
- `packages/core/src/types/captions.ts`
- `packages/core/src/player/Announcer.ts`
- `packages/core/src/player/StateMachine.ts`

#### 5. Technical Approach & Interface Contracts
```typescript
// packages/core/src/types/config.ts
export interface LumoPlayerConfig {
  src: string;
  poster?: string;
  title: string;
  captionsEn?: string;
  captionsAm?: string;
  eslSrc?: string;
  audioDescriptionSrc?: string;
  offlineEnabled?: boolean;
  aiEducatorEnabled?: boolean;
  lessonId?: string;
}

export type PlaybackState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';

export interface LumoEventMap {
  'lumo:play': CustomEvent<{ currentTime: number }>;
  'lumo:pause': CustomEvent<{ currentTime: number }>;
  'lumo:captionchange': CustomEvent<{ language: 'en' | 'am' | 'off'; fontSize: number }>;
  'lumo:eslopen': CustomEvent<{ position: { x: number; y: number } }>;
  'lumo:eslclose': CustomEvent<void>;
  'lumo:adtoggle': CustomEvent<{ enabled: boolean }>;
  'lumo:offline:ready': CustomEvent<{ packageId: string; sizeBytes: number }>;
  'lumo:error': CustomEvent<{ code: string; message: string }>;
}
```

#### 6. Unit & Integration Tests
- `packages/core/tests/Announcer.test.ts`: Verify announcer appends DOM nodes with `aria-live="polite"` and cleans up after 1000ms.
- `packages/core/tests/StateMachine.test.ts`: Verify valid state transitions (IDLE -> LOADING -> PLAYING -> PAUSED -> ENDED) and rejection of invalid transitions.

#### 7. Acceptance Criteria & Definition of Done
- Types compile with zero diagnostics under `tsc --noEmit`.
- StateMachine passes 100% of transition test matrices.

---

### Phase 2: Accessible Media Player Component

#### 1. Objective
Implement the `<lumo-player>` Web Component with custom ARIA controls over a native `<video>` element, guaranteeing 100% keyboard and screen-reader operability.

#### 2. Prerequisites
Phase 1 complete.

#### 3. Exact Tasks
- [ ] Task 2.1: Create custom element `LumoPlayer` extending `HTMLElement`, attaching Shadow DOM (`mode: 'open'`).
- [ ] Task 2.2: Implement native `<video>` wrapper with `playsinline`, `preload="metadata"`, and `crossorigin="anonymous"`.
- [ ] Task 2.3: Build custom controls toolbar (`role="toolbar"`, `aria-label="Playback controls"`).
- [ ] Task 2.4: Implement Play/Pause toggle button (`aria-label="Play video"`, toggles to `"Pause video"`, updates `aria-pressed`).
- [ ] Task 2.5: Implement accessible seek bar using `<input type="range">` with `min="0"`, `max="duration"`, `step="1"`, `aria-label="Seek slider"`, and formatted `aria-valuetext` (e.g., "1 minute 42 seconds").
- [ ] Task 2.6: Implement volume slider and mute button (`aria-label="Mute"`, `aria-pressed="false"`).
- [ ] Task 2.7: Implement 10-second skip back (`aria-label="Rewind 10 seconds"`) and skip forward buttons.
- [ ] Task 2.8: Implement playback speed selector button (0.5x, 0.75x, 1x, 1.25x, 1.5x) with accessible popup or cycle announcement.
- [ ] Task 2.9: Implement `KeyboardHandler.ts` binding keys:
  - `Space` / `K`: Play / Pause toggle
  - `Left Arrow` / `J`: Seek back 5 seconds
  - `Right Arrow` / `L`: Seek forward 5 seconds
  - `Up Arrow`: Volume up 10%
  - `Down Arrow`: Volume down 10%
  - `M`: Toggle mute
  - `C`: Toggle captions
  - `D`: Toggle audio description
  - `S`: Toggle ESL window
  - `F`: Toggle fullscreen
- [ ] Task 2.10: Style controls in `player.css` with 48x48px minimum touch targets, high-contrast outlines (`3px solid #0066cc; outline-offset: 2px`), and responsive wrapping for 320px mobile screens.

#### 4. Files & Modules Expected
- `packages/core/src/player/LumoPlayer.ts`
- `packages/core/src/player/KeyboardHandler.ts`
- `packages/core/src/styles/player.css`
- `packages/core/src/utils/formatTime.ts`

#### 5. ARIA & DOM Structure
```html
<lumo-player role="region" aria-label="Accessible video lesson">
  #shadow-root (open)
    <div class="lumo-container">
      <video class="lumo-video" playsinline></video>
      <div class="lumo-caption-overlay" aria-hidden="true"></div>
      
      <!-- Screen Reader Live Announcer -->
      <div class="lumo-sr-only" aria-live="polite" aria-atomic="true" id="sr-announcer"></div>

      <!-- Control Toolbar -->
      <div class="lumo-controls" role="toolbar" aria-label="Playback controls">
        <button class="lumo-btn" id="btn-play" aria-label="Play video" aria-pressed="false">
          <svg aria-hidden="true">...</svg>
        </button>
        <button class="lumo-btn" id="btn-rewind" aria-label="Rewind 10 seconds">
          <svg aria-hidden="true">...</svg>
        </button>
        
        <!-- Seek Slider -->
        <div class="lumo-seek-group">
          <input type="range" id="seek-bar" min="0" max="100" value="0"
                 aria-label="Seek slider" aria-valuemin="0" aria-valuemax="100" 
                 aria-valuenow="0" aria-valuetext="0 seconds" />
          <span class="lumo-time-display" aria-hidden="true">00:00 / 00:00</span>
        </div>

        <button class="lumo-btn" id="btn-forward" aria-label="Forward 10 seconds">
          <svg aria-hidden="true">...</svg>
        </button>
        
        <!-- Volume -->
        <button class="lumo-btn" id="btn-mute" aria-label="Mute audio" aria-pressed="false">
          <svg aria-hidden="true">...</svg>
        </button>
        <input type="range" id="volume-bar" min="0" max="100" value="80" 
               aria-label="Volume control" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" />

        <!-- Feature Toggles -->
        <button class="lumo-btn" id="btn-captions" aria-label="Toggle captions" aria-pressed="false">CC</button>
        <button class="lumo-btn" id="btn-esl" aria-label="Toggle sign language window" aria-pressed="false">ESL</button>
        <button class="lumo-btn" id="btn-ad" aria-label="Toggle audio description" aria-pressed="false">AD</button>
        <button class="lumo-btn" id="btn-speed" aria-label="Playback speed: 1.0x">1.0x</button>
      </div>
    </div>
</lumo-player>
```

#### 6. Unit & Integration Tests
- `packages/core/tests/LumoPlayer.test.ts`: Test mounting, DOM rendering, attribute parsing (`src`, `poster`).
- `packages/core/tests/KeyboardHandler.test.ts`: Dispatch key events; verify `video.currentTime` and `video.paused` states update accordingly.
- `tests/a11y/axe-player.spec.ts`: Run `axe.run()` against `<lumo-player>` in loaded, playing, and paused states. Assert 0 violations.

#### 7. Acceptance Criteria & Definition of Done
- Player renders in any clean HTML document.
- Fully controllable with Tab, Space, Arrow keys with zero mouse interaction.
- `axe-core` passes with 0 critical, 0 serious, 0 moderate violations.
- Screen reader announces playback toggles and formatted time updates.

---

### Phase 3: Caption & Transcript Engine

#### 1. Objective
Deliver synchronized dual-language (English and Amharic) WebVTT caption rendering with customizable font sizing, high-contrast color presets, and an interactive synchronized transcript.

#### 2. Prerequisites
Phase 2 complete.

#### 3. Exact Tasks
- [ ] Task 3.1: Implement WebVTT parsing engine (`VTTParser.ts`) capable of handling cue timestamps (`00:00:00.000`), multi-line text, and language tags.
- [ ] Task 3.2: Implement custom caption overlay container in Shadow DOM, isolated from host page styles.
- [ ] Task 3.3: Implement Noto Sans Ethiopic font integration with `font-display: swap` and Amharic CSS typography rules (`line-height: 1.65; letter-spacing: 0; direction: ltr`).
- [ ] Task 3.4: Implement caption size controls: 100% (16px), 150% (24px), 200% (32px).
- [ ] Task 3.5: Implement color schemes:
  - Scheme A: White text on 85% solid black (`#ffffff` on `rgba(0,0,0,0.85)`) — Contrast 15:1
  - Scheme B: Yellow text on 95% solid black (`#ffd700` on `rgba(0,0,0,0.95)`) — Contrast 16.8:1
  - Scheme C: Black text on solid white (`#000000` on `#ffffff`) — Contrast 21:1
- [ ] Task 3.6: Build `<lumo-transcript>` subcomponent: scrollable panel displaying all cues, highlighting active cue during playback, allowing click-to-seek.
- [ ] Task 3.7: Implement export transcript button to download `.txt` or `.vtt` file.
- [ ] Task 3.8: Add language selector button (Off / English / Amharic) updating live captions without frame drops or audio stutter.

#### 4. Files & Modules Expected
- `packages/core/src/captions/VTTParser.ts`
- `packages/core/src/captions/CaptionRenderer.ts`
- `packages/core/src/captions/TranscriptSync.ts`
- `packages/core/src/styles/captions.css`

#### 5. Technical Approach & Ethiopic Handling
```css
/* packages/core/src/styles/captions.css */
.lumo-cue-box {
  position: absolute;
  bottom: 60px;
  left: 5%;
  right: 5%;
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.lumo-cue-text {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  transition: font-size 150ms ease-out;
}

/* Specific Amharic Rules */
.lumo-cue-text[lang="am"] {
  font-family: 'Noto Sans Ethiopic', system-ui, sans-serif;
  line-height: 1.65 !important;
  letter-spacing: 0 !important;
  direction: ltr !important; /* Explicitly LTR: Ethiopic Fidel is never RTL */
}

/* Sizing Tokens */
.lumo-cue-text.size-100 { font-size: 16px; }
.lumo-cue-text.size-150 { font-size: 24px; }
.lumo-cue-text.size-200 { font-size: 32px; }

/* Color Themes */
.theme-white-black { color: #ffffff; background-color: rgba(0, 0, 0, 0.88); }
.theme-yellow-black { color: #ffd700; background-color: rgba(0, 0, 0, 0.95); }
.theme-black-white { color: #000000; background-color: #ffffff; border: 2px solid #000000; }
```

#### 6. Unit & Integration Tests
- `VTTParser.test.ts`: Parse sample English and Amharic `.vtt` strings; verify timestamp to milliseconds conversion and cue extraction.
- `TranscriptSync.test.ts`: Verify timeupdate events trigger active cue CSS class toggles and auto-scroll within transcript container.
- `tests/e2e/captions-amharic.spec.ts`: Verify Amharic Fidel characters (`ሰላም`, `ትምህርት`) render with Noto Sans Ethiopic font on Android viewport (360x640).

#### 7. Acceptance Criteria & Definition of Done
- Amharic captions render clearly without character overlap or vertical clipping.
- Dynamic font scaling to 200% does not push caption text outside the video viewport.
- Cues synchronize to within 100ms of video clock.
- Transcript is keyboard searchable and navigable.

---

### Phase 4: Ethiopian Sign Language (ESL) Window

#### 1. Objective
Implement a synchronized, floating, movable, and resizable Ethiopian Sign Language interpreter video window with full keyboard accessibility and mobile responsiveness.

#### 2. Prerequisites
Phase 2 and Phase 3 complete.

#### 3. Exact Tasks
- [ ] Task 4.1: Create `ESLWindow.ts` component rendering as a movable modal overlay (`role="dialog"`, `aria-label="Ethiopian Sign Language interpreter"`).
- [ ] Task 4.2: Embed secondary `<video>` element inside ESL dialog (`muted`, `playsinline`).
- [ ] Task 4.3: Implement `VideoSync.ts` locking secondary video clock to main video clock:
  - Main Play -> ESL Play
  - Main Pause -> ESL Pause
  - Main Seek -> ESL Seek (re-sync delta > 200ms)
- [ ] Task 4.4: Implement mouse and touch drag handles:
  - Header drag handle moving dialog within viewport boundaries.
  - Constrain coordinates so window cannot be dragged off-screen.
- [ ] Task 4.5: Implement resize handles (bottom-right corner) with minimum size 180x240px and maximum 50% viewport width.
- [ ] Task 4.6: Implement keyboard positioning:
  - When ESL dialog has focus, `Arrow Keys` move window 20px per keypress.
  - `Shift + Arrow Keys` resize window 20px per keypress.
  - Announce position changes to screen reader (`Announcer.announce("Sign language window moved")`).
- [ ] Task 4.7: Implement focus trapping within ESL dialog when opened via keyboard; `Escape` key closes window and returns focus to the ESL toggle button.
- [ ] Task 4.8: Implement responsive mobile mode (< 768px): dock window automatically to bottom-right; replace free drag with a two-state Toggle (Compact 140x180px / Expanded 50% screen).
- [ ] Task 4.9: Persist coordinates and size to `localStorage` (`lumo_esl_pos`, `lumo_esl_size`).

#### 4. Files & Modules Expected
- `packages/core/src/esl/ESLWindow.ts`
- `packages/core/src/esl/VideoSync.ts`
- `packages/core/src/esl/TouchDrag.ts`
- `packages/core/src/styles/esl.css`

#### 5. ARIA & Dialog Structure
```html
<div class="lumo-esl-dialog" 
     role="dialog" 
     aria-label="Ethiopian Sign Language interpreter" 
     aria-modal="false"
     tabindex="-1">
  <div class="lumo-esl-header" id="esl-drag-handle">
    <span class="lumo-esl-title" aria-hidden="true">EthSL Interpreter</span>
    <button class="lumo-btn-close" aria-label="Close sign language window">&times;</button>
  </div>
  <div class="lumo-esl-body">
    <video class="lumo-esl-video" muted playsinline></video>
  </div>
  <div class="lumo-esl-resize-handle" aria-hidden="true"></div>
  <div class="lumo-sr-only" id="esl-position-desc">
    Use arrow keys to move window, Shift plus arrow keys to resize, Escape to close.
  </div>
</div>
```

#### 6. Unit & Integration Tests
- `VideoSync.test.ts`: Simulate main video seek from 10s to 45s; verify ESL video `currentTime` is set to 45s within 1 tick.
- `TouchDrag.test.ts`: Simulate drag events beyond viewport (x: -50, y: 5000); verify bounding logic clamps position safely inside screen.
- `tests/e2e/esl-window.spec.ts`: Verify pressing `S` opens dialog, focus shifts into dialog, `Escape` closes dialog and restores focus to `btn-esl`.

#### 7. Acceptance Criteria & Definition of Done
- ESL video plays strictly in sync with main video with zero audible bleed (muted).
- Window can be repositioned and resized via both mouse/touch and keyboard.
- Works seamlessly on Android viewport without overflowing screen.
- Passes `axe-core` dialog compliance check.

---

### Phase 5: Audio Description Engine

#### 1. Objective
Implement the Audio Description module using the dual-source video switching strategy with synchronized timestamp preservation, backed by WebVTT text-based description fallbacks.

#### 2. Prerequisites
Phase 2 and Phase 3 complete.

#### 3. Exact Tasks
- [ ] Task 5.1: Create `ADController.ts` in `packages/core/src/audio-description/`.
- [ ] Task 5.2: Implement dual-source media switching:
  - Cache current `currentTime` and `paused` state.
  - Swap `<video>` source URL to `audioDescriptionSrc`.
  - Restore `currentTime` and resume playback seamlessly.
- [ ] Task 5.3: Implement Audio Description toggle button (`btn-ad`, `aria-label="Toggle audio description"`, `aria-pressed="false"`).
- [ ] Task 5.4: Implement WebVTT text-based description fallback (`TextADFallback.ts`):
  - When no separate AD video is provided, parse `descriptions.vtt`.
  - Dispatch cues to `Announcer.announce(cueText, 'polite')` so NVDA / TalkBack speaks the description during audio pauses.
- [ ] Task 5.5: Provide UI indicator badge "AD Active" on player.

#### 4. Files & Modules Expected
- `packages/core/src/audio-description/ADController.ts`
- `packages/core/src/audio-description/TextADFallback.ts`

#### 5. Technical Approach & Source Swap Logic
```typescript
export class ADController {
  private isADActive = false;

  constructor(
    private videoElement: HTMLVideoElement,
    private standardSrc: string,
    private describedSrc?: string,
    private announcer?: Announcer
  ) {}

  public toggle(): boolean {
    if (!this.describedSrc) return false;

    const currentTime = this.videoElement.currentTime;
    const isPaused = this.videoElement.paused;
    this.isADActive = !this.isADActive;

    this.videoElement.src = this.isADActive ? this.describedSrc : this.standardSrc;
    this.videoElement.currentTime = currentTime;

    if (!isPaused) {
      this.videoElement.play().catch(console.error);
    }

    this.announcer?.announce(
      this.isADActive ? "Audio description enabled" : "Audio description disabled"
    );

    return this.isADActive;
  }
}
```

#### 6. Unit & Integration Tests
- `ADController.test.ts`: Verify source URL changes, `currentTime` is retained exactly, and playback state resumes.
- `TextADFallback.test.ts`: Verify description cues trigger `Announcer.announce` with correct text.

#### 7. Acceptance Criteria & Definition of Done
- Toggling Audio Description switches media track within 300ms without restarting the video from 00:00.
- State is clearly announced to screen readers.
- If no AD track is provided in attributes, the AD button is gracefully hidden from the DOM to avoid confusing users.

---

### Phase 6: Accessible Document Processing

#### 1. Objective
Implement the backend document conversion pipeline that transforms inaccessible course PDFs into structured, semantic, screen-reader-ready HTML and Tagged PDF alternatives.

#### 2. Prerequisites
Phase 0 complete (Python environment configured).

#### 3. Exact Tasks
- [ ] Task 6.1: Implement PDF extraction engine in `services/api/app/services/pdf_extractor.py` using `pdfminer.six` and `pdfplumber`.
- [ ] Task 6.2: Implement heading detection heuristics based on font size, weight, and layout hierarchy (`h1`, `h2`, `h3`).
- [ ] Task 6.3: Implement table extractor converting PDF tabular structures into semantic HTML `<table>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` with `scope="col"` and `scope="row"`.
- [ ] Task 6.4: Implement image extraction flagging images without embedded alt text, generating placeholder tags `alt="[Image: Content author review required]"`.
- [ ] Task 6.5: Implement HTML generator producing clean, WCAG 2.2 AA compliant markup with skip links and semantic landmarks (`<main>`, `<article>`, `<header>`).
- [ ] Task 6.6: Implement FastAPI endpoint `POST /v1/documents/process` and `GET /v1/documents/{id}`.
- [ ] Task 6.7: Build client-side demonstration viewer in `apps/web/app/demo/documents/page.tsx` showing before (raw PDF) and after (semantic HTML).

#### 4. Files & Modules Expected
- `services/api/app/api/v1/documents.py`
- `services/api/app/services/pdf_extractor.py`
- `services/api/app/services/html_generator.py`
- `services/api/app/schemas/document.py`
- `packages/document-processor/src/HTMLSanitizer.ts`

#### 5. Technical Approach & Schema
```python
# services/api/app/schemas/document.py
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class DocumentProcessRequest(BaseModel):
    document_url: Optional[HttpUrl] = None
    title: str

class ExtractedHeading(BaseModel):
    level: int
    text: str

class FlaggedImage(BaseModel):
    page: int
    image_index: int
    suggested_context: str

class DocumentResponse(BaseModel):
    document_id: str
    status: str  # "PROCESSING" | "COMPLETED" | "FAILED"
    accessible_html_url: Optional[str] = None
    headings_found: List[ExtractedHeading] = []
    flags: List[FlaggedImage] = []
    created_at: datetime
```

#### 6. Unit & Integration Tests
- `services/api/tests/test_pdf_extractor.py`: Test extraction of sample two-column PDF; verify reading order flows logically without interleaving columns.
- `services/api/tests/test_html_generator.py`: Verify generated HTML contains valid doctype, `lang` attribute, and zero missing table headers.
- Automated axe-core test on the resulting HTML page verifying 0 violations.

#### 7. Acceptance Criteria & Definition of Done
- PDFs with headings and tables convert to HTML with correct `<h1>`–`<h6>` hierarchy.
- Output HTML passes axe-core automated audit with zero critical/serious issues.
- Reading order verified in NVDA reading top-to-bottom logically.

---

### Phase 7: Offline Learning Packages

#### 1. Objective
Implement the offline learning module allowing learners on 3G networks to download a complete lesson package (< 10 MB) comprising compressed audio, WebVTT captions, and an accessible HTML player runnable completely disconnected.

#### 2. Prerequisites
Phases 2, 3, and 6 complete.

#### 3. Exact Tasks
- [ ] Task 7.1: Build backend package generation worker (`services/media-processor/workers/zip_builder.py`):
  - Extract speech audio track from MP4 using ffmpeg (`-vn -c:a libmp3lame -b:a 64k -ar 44100`).
  - Package `manifest.json`, `lesson.html`, `audio.mp3`, `captions-en.vtt`, `captions-am.vtt`, and `transcript.txt`.
  - Calculate SHA-256 checksums for each file and record in manifest.
- [ ] Task 7.2: Create client-side Service Worker (`packages/offline/src/sw.ts`):
  - Precache core offline application shell.
  - Implement cache-first interception for URLs matching `/offline-packages/*`.
- [ ] Task 7.3: Implement `IDBStore.ts` storing lesson metadata, download timestamps, and local blob URLs.
- [ ] Task 7.4: Implement client-side `PackageDownloader.ts` reporting download progress (0%–100%) and announcing completion via ARIA live region.
- [ ] Task 7.5: Build standalone, single-file `lesson.html` offline player template:
  - Uses native `<audio>` element with custom accessible controls.
  - Inlines CSS and minimal JavaScript (< 25 KB total size).
  - Contains full interactive transcript and dual captions.
- [ ] Task 7.6: Request persistent browser storage via `navigator.storage.persist()`.

#### 4. Files & Modules Expected
- `services/media-processor/workers/zip_builder.py`
- `packages/offline/src/sw.ts`
- `packages/offline/src/IDBStore.ts`
- `packages/offline/src/PackageDownloader.ts`
- `packages/offline/src/templates/lesson.html`

#### 5. Offline Package Manifest Schema
```json
{
  "schemaVersion": "1.0",
  "lessonId": "lesson-01-python-basics",
  "title": "Introduction to Python Programming",
  "version": "1.0.4",
  "createdAt": "2026-11-14T10:00:00Z",
  "files": [
    { "path": "lesson.html", "sizeBytes": 24576, "sha256": "e3b0c44..." },
    { "path": "audio.mp3", "sizeBytes": 4194304, "sha256": "4b22777..." },
    { "path": "captions-en.vtt", "sizeBytes": 18432, "sha256": "ef2d127..." },
    { "path": "captions-am.vtt", "sizeBytes": 24576, "sha256": "8f3b110..." },
    { "path": "transcript-en.txt", "sizeBytes": 12288, "sha256": "1a2b3c4..." }
  ],
  "totalSizeBytes": 4274176
}
```

#### 6. Unit & Integration Tests
- `zip_builder.test.py`: Verify generated zip contains all files in manifest and total size is under 10 MB for a 45-minute audio lesson.
- `IDBStore.test.ts`: Verify saving and querying lessons using fake-indexeddb.
- `tests/e2e/offline-cache.spec.ts`: Load player in browser, initiate download, simulate `page.context.setOffline(true)`, navigate to cached lesson, assert audio plays and captions render.

#### 7. Acceptance Criteria & Definition of Done
- Total package size for 45-minute lesson is under 8 MB.
- Offline player functions with 100% network disconnection in Chrome on Android.
- Checksum validation rejects tampered files.

---

### Phase 8: JavaScript Embed SDK

#### 1. Objective
Bundle all client modules into a single, production-ready, highly optimized JavaScript artifact (`lumo.min.js`) that any host page can embed via a single `<script>` tag.

#### 2. Prerequisites
Phases 1, 2, 3, 4, 5, and 7 complete.

#### 3. Exact Tasks
- [ ] Task 8.1: Create bundle entrypoint in `packages/embed-sdk/src/index.ts`.
- [ ] Task 8.2: Implement auto-registration: check if `customElements.get('lumo-player')` exists; if not, define it.
- [ ] Task 8.3: Implement attribute observation on `<lumo-player>`:
  - `observedAttributes`: `['src', 'captions-en', 'captions-am', 'esl-src', 'audio-description-src', 'offline-enabled']`
  - `attributeChangedCallback` dynamically updates internal player state.
- [ ] Task 8.4: Configure Rollup build pipeline with `terser` minification, tree-shaking, and inline CSS injection into Shadow DOM templates.
- [ ] Task 8.5: Enforce bundle size budget: assert uncompressed size < 120 KB, gzipped size < 40 KB.
- [ ] Task 8.6: Implement fallback detection: if browser does not support Custom Elements or Shadow DOM (e.g. extremely old mobile browser), unhide native `<video>` controls gracefully.

#### 4. Files & Modules Expected
- `packages/embed-sdk/src/index.ts`
- `packages/embed-sdk/src/loader.ts`
- `packages/embed-sdk/rollup.config.js`
- `packages/embed-sdk/dist/lumo.min.js`

#### 5. Integration Code Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Host Learning Platform</title>
  <!-- Single script tag integration -->
  <script src="https://cdn.lumo-a11y.dev/v1/lumo.min.js" defer></script>
</head>
<body>
  <main>
    <h1>Lesson 1: Digital Foundations</h1>
    <lumo-player
      src="/media/lesson-01.mp4"
      captions-en="/media/lesson-01-en.vtt"
      captions-am="/media/lesson-01-am.vtt"
      esl-src="/media/lesson-01-esl.mp4"
      audio-description-src="/media/lesson-01-ad.mp4"
      offline-enabled="true">
    </lumo-player>
  </main>
</body>
</html>
```

#### 6. Unit & Integration Tests
- `bundle-size.test.ts`: Read `dist/lumo.min.js`, gzip it, assert byte size is under 40,960 bytes.
- E2E script injection test: Load a bare HTML file containing only the script tag and `<lumo-player>`; verify custom element upgrades within 50ms.

#### 7. Acceptance Criteria & Definition of Done
- Single-line integration functions in a plain static HTML file.
- Gzipped bundle size strictly under 40 KB.
- Zero external runtime script dependencies.

---

### Phase 9: REST API & OpenAPI

#### 1. Objective
Implement the complete FastAPI server exposing REST interfaces for caption generation, document conversion, offline packaging, and health monitoring, with automatic OpenAPI documentation.

#### 2. Prerequisites
Phases 6 and 7 complete.

#### 3. Exact Tasks
- [ ] Task 9.1: Configure FastAPI application in `services/api/app/main.py` with CORS middleware, request ID middleware, and structured logging.
- [ ] Task 9.2: Implement API key authentication dependency (`X-Lumo-Key` header).
- [ ] Task 9.3: Mount routers:
  - `/v1/captions`
  - `/v1/documents`
  - `/v1/packages`
  - `/v1/lessons`
  - `/v1/health`
- [ ] Task 9.4: Configure OpenAPI metadata (title, version, terms of service, contact, MIT license).
- [ ] Task 9.5: Implement standard error envelope handler capturing `HTTPException` and validation errors.
- [ ] Task 9.6: Write Dockerfile and Docker Compose service definition.

#### 4. Files & Modules Expected
- `services/api/app/main.py`
- `services/api/app/core/config.py`
- `services/api/app/core/security.py`
- `services/api/app/api/v1/*.py`
- `services/api/Dockerfile`

#### 5. Technical Approach & Error Model
```python
# Standardized Error Envelope
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

#### 6. Unit & Integration Tests
- `services/api/tests/test_health.py`: `GET /v1/health` returns status `healthy` (HTTP 200).
- `services/api/tests/test_auth.py`: Requests with missing or invalid `X-Lumo-Key` receive HTTP 401.
- OpenAPI schema validation test: Check `/v1/openapi.json` conforms to OpenAPI 3.1.0 specification.

#### 7. Acceptance Criteria & Definition of Done
- All endpoints documented and interactive via Swagger UI at `/docs`.
- Automated test coverage > 85% across all API routers.
- Docker container builds and starts in under 15 seconds.

---

### Phase 10: Savanna Platform Integration

#### 1. Objective
Demonstrate seamless integration of Lumo into the actual ALX `Savanna-static-pages` repository without modifying any host framework or backend code.

#### 2. Prerequisites
Phase 8 complete (`lumo.min.js` ready).

#### 3. Exact Tasks
- [ ] Task 10.1: Clone or load `alx-africa/Savanna-static-pages` static HTML templates.
- [ ] Task 10.2: Locate existing lesson view pages containing native `<video controls>` elements.
- [ ] Task 10.3: Insert Lumo CDN script tag and Google Fonts Noto Sans Ethiopic link into `<head>`.
- [ ] Task 10.4: Replace native `<video>` tag with `<lumo-player>` passing lesson media attributes.
- [ ] Task 10.5: Verify no layout shifts or CSS conflicts with Savanna's existing stylesheet.
- [ ] Task 10.6: Run axe-core audit against the modified Savanna page; verify 0 accessibility violations.
- [ ] Task 10.7: Document exact before/after git diff in `docs/savanna-integration.md`.

#### 4. Files & Modules Expected
- `docs/savanna-integration.md`
- `tests/e2e/savanna-integration.spec.ts`

#### 5. Acceptance Criteria & Definition of Done
- Savanna lesson page renders Lumo player with zero visual regression.
- Keyboard navigation operates through Savanna navbar, into Lumo controls, and down to page footer without focus traps.
- Rollback can be executed in under 2 minutes by reverting 3 lines of HTML.

---

### Phase 11: Web Demonstration Application

#### 1. Objective
Build the Next.js reference demonstration application showcasing all modules, developer documentation, and the Career Gateway accessible job card.

#### 2. Prerequisites
Phases 8, 9, and 10 complete.

#### 3. Exact Tasks
- [ ] Task 11.1: Initialize Next.js 14 App Router project in `apps/web/`.
- [ ] Task 11.2: Build landing page (`/`) highlighting hackathon track, value proposition, and persona scenarios.
- [ ] Task 11.3: Build comprehensive demo hub (`/demo`) with interactive controls to switch sample lessons.
- [ ] Task 11.4: Build isolated module demonstration routes:
  - `/demo/player`
  - `/demo/captions`
  - `/demo/esl`
  - `/demo/offline`
  - `/demo/documents`
- [ ] Task 11.5: Build Career Gateway component (`/jobs`):
  - Accessible job card with audio summary button.
  - Usable and tested at 200% browser zoom without text truncation.
  - Structured data with `schema.org/JobPosting` and accessibility fields.
  - Verifiable certificate link with mock Open Badges 3.0 metadata.
- [ ] Task 11.6: Build interactive documentation viewer (`/docs`) and embedded Swagger UI (`/api-docs`).

#### 4. Files & Modules Expected
- `apps/web/app/page.tsx`
- `apps/web/app/demo/page.tsx`
- `apps/web/app/jobs/page.tsx`
- `apps/web/components/JobCard.tsx`

#### 5. Acceptance Criteria & Definition of Done
- Web application builds with 0 errors via `pnpm build`.
- `/jobs` card remains completely legible and operable at 200% zoom.
- All demo routes pass automated axe-core scanning.

---

### Phase 12: AI Educator (Optional Capability)

#### 1. Objective
Implement the optional, source-grounded conversational AI tutor with strict provider abstraction, defaulting to local open-source models (Ollama/Qwen2.5) with zero dependencies on paid APIs.

#### 2. Prerequisites
Phase 9 and Phase 11 complete. Core accessibility must be 100% verified before this phase begins.

#### 3. Exact Tasks
- [ ] Task 12.1: Define `LLMProvider` abstract interface in `services/api/app/services/ai/base.py`.
- [ ] Task 12.2: Implement `OllamaProvider` connecting to local Llama 3.1 8B / Qwen2.5 instance.
- [ ] Task 12.3: Implement transcript RAG chunker: split lesson VTT transcript into semantic segments with timestamp metadata.
- [ ] Task 12.4: Implement grounded prompt generator: strictly constrain LLM to answer only using transcript context, quoting timestamps.
- [ ] Task 12.5: Implement endpoint `POST /v1/lessons/{id}/ask` returning answer text and source timestamp citations.
- [ ] Task 12.6: Build accessible client chat drawer in `<lumo-player>` (disabled by default, toggled via `ai-educator="true"` attribute).
- [ ] Task 12.7: Ensure complete decoupling: if Ollama server is offline, player displays "AI Educator is currently offline; lesson content unaffected".

#### 4. Files & Modules Expected
- `services/api/app/services/ai/base.py`
- `services/api/app/services/ai/ollama.py`
- `services/api/app/services/ai/rag.py`
- `services/api/app/api/v1/lessons.py`
- `packages/ai-educator/src/ChatController.ts`

#### 5. Acceptance Criteria & Definition of Done
- Answers are verified to originate strictly from lesson context.
- Player core functionality remains 100% operational if AI backend fails.
- Chat interface conforms to WAI-ARIA live region guidelines.

---

### Phase 13: Accessibility & Real-User Validation

#### 1. Objective
Execute the rigorous hackathon gate test verification: automated axe-core scans, manual NVDA and TalkBack testing, and real-user co-design evaluation loops.

#### 2. Prerequisites
All core modules (Phases 1–11) deployed to staging/local test environment.

#### 3. Exact Tasks
- [ ] Task 13.1: Execute automated `@axe-core/playwright` test suite across all web pages and components. Target: **Zero critical, zero serious, zero moderate issues**.
- [ ] Task 13.2: Execute Desktop Screen Reader protocol with **NVDA 2024 + Chrome 130** on Windows:
  - Verify every button announces name, role, and state.
  - Verify seek slider announces formatted minutes and seconds.
  - Verify Amharic captions do not cause pronunciation crashes.
- [ ] Task 13.3: Execute Mobile Screen Reader protocol with **TalkBack on Android 11+ Chrome**:
  - Test swipe-to-navigate order.
  - Verify 48x48dp touch targets.
- [ ] Task 13.4: Execute Keyboard-Only audit:
  - Unplug mouse. Navigate complete lesson, toggle captions, move ESL window, download offline package.
- [ ] Task 13.5: Execute 200% Browser Zoom audit:
  - Assert zero overlapping text, zero truncated controls, zero horizontal scroll on body.
- [ ] Task 13.6: Execute Sound-Off audit:
  - Mute computer audio. Verify all information is conveyed through captions and visual cues.
- [ ] Task 13.7: Conduct Co-Designer testing loop with assigned hackathon participants using the protocol in Section 11.
- [ ] Task 13.8: Compile and format official `WCAG_2.2_AA_Conformance_Report.md`.

#### 4. Files & Modules Expected
- `tests/a11y/wcag-audit.ts`
- `tests/screenreader-scripts/nvda-desktop-script.md`
- `docs/WCAG_2.2_AA_Conformance_Report.md`
- `docs/co-design-test-results.md`

#### 5. Acceptance Criteria & Definition of Done
- Zero axe-core violations reported in CI.
- All co-designer tasks completed unaided.
- Formal WCAG 2.2 AA report signed off and added to repository.

---

### Phase 14: Documentation & One-Hour Integration Challenge

#### 1. Objective
Author comprehensive, developer-grade documentation and validate that an external engineer or hackathon judge can successfully integrate Lumo into an arbitrary web page in under 60 minutes.

#### 2. Prerequisites
Phase 10 and Phase 11 complete.

#### 3. Exact Tasks
- [ ] Task 14.1: Write root `README.md` containing product overview, live demo links, architecture diagram, and MIT license.
- [ ] Task 14.2: Author `docs/quick-start.md`: 5-step integration guide under 500 words.
- [ ] Task 14.3: Author `docs/one-hour-challenge.md`: timed walkthrough for evaluators.
- [ ] Task 14.4: Author `docs/accessibility-statement.md` and `docs/privacy-policy.md`.
- [ ] Task 14.5: Author `docs/api-reference.md` and export static OpenAPI specification.
- [ ] Task 14.6: Run timed rehearsal with an independent engineer: record time from reading README to functioning player. Target: < 40 minutes.

#### 4. Files & Modules Expected
- `README.md`
- `docs/quick-start.md`
- `docs/one-hour-challenge.md`
- `docs/savanna-integration.md`
- `docs/api-reference.md`
- `docs/accessibility-statement.md`

#### 5. Acceptance Criteria & Definition of Done
- Quick Start guide enables working integration in < 15 lines of code.
- Rehearsal integration completed successfully in under 60 minutes.

---

### Phase 15: Telegram Bot Architecture (Future Phase)

#### 1. Objective
Specify the future secondary delivery channel delivering lesson audio, text transcripts, and AI Q&A via Telegram bot, strictly reusing Level 2 REST APIs.

#### 2. Prerequisites
All hackathon core deliverables (Phases 0–14) completed and submitted.

#### 3. Exact Tasks
- [ ] Task 15.1: Define Telegram bot command schema (`/lesson`, `/caption`, `/ask`, `/offline`) in `apps/telegram-bot/`.
- [ ] Task 15.2: Implement API client communicating with Lumo FastAPI backend via `X-Lumo-Key`.
- [ ] Task 15.3: Document accessibility constraints of Telegram client (inability to render Web Components or custom video overlays; audio/text fallback model).
- [ ] Task 15.4: Provide deployment guide for Telegram polling/webhook worker in Docker Compose.

#### 4. Files & Modules Expected
- `apps/telegram-bot/bot/main.py`
- `apps/telegram-bot/README.md`

#### 5. Acceptance Criteria & Definition of Done
- Complete architecture and command interface specified without modifying core API contracts.

---

## 5. API Implementation Plan

The Lumo REST API provides headless, programmatic access to all accessibility processing services. It is developed using **FastAPI** (Python 3.11) to guarantee native asynchronous I/O, automatic Pydantic v2 data validation, and automated OpenAPI 3.1.0 schema generation.

### 5.1 Base Configuration & Security
- **Production Base URL:** `https://api.lumo-a11y.dev/v1`
- **Development Base URL:** `http://localhost:8000/v1`
- **Authentication:** `X-Lumo-Key` HTTP Header containing tenant API token.
- **Rate Limits:**
  - Standard endpoints: 100 requests / minute per API key.
  - Document / Package heavy processing: 20 requests / hour per API key.
  - Health check: Unthrottled.

### 5.2 Complete Endpoint Specifications

#### 1. Caption Generation
- **Endpoint:** `POST /v1/captions/generate`
- **Purpose:** Submit an audio/video URL or audio file for speech-to-text transcription and WebVTT alignment.
- **Request Body (JSON):**
```json
{
  "media_url": "https://storage.platform.com/lessons/lesson-01.mp4",
  "language": "am",
  "target_languages": ["am", "en"],
  "callback_url": "https://platform.com/webhooks/captions"
}
```
- **Response (HTTP 202 Accepted):**
```json
{
  "job_id": "cap_01jd93m8z4...",
  "status": "QUEUED",
  "estimated_duration_seconds": 45,
  "created_at": "2026-11-14T10:00:00Z"
}
```

- **Endpoint:** `GET /v1/captions/{id}`
- **Purpose:** Retrieve generated WebVTT caption file.
- **Response (HTTP 200 OK — `text/vtt`):**
```vtt
WEBVTT - Lumo Generated Captions
Language: am

00:00:01.000 --> 00:00:04.500
<lang am>እንኳን ወደዚህ ትምህርት በደህና መጡ።</lang>

00:00:05.000 --> 00:00:09.200
<lang am>ዛሬ ስለ ዲጂታል ተደራሽነት እንማራለን።</lang>
```

#### 2. Accessible Document Processing
- **Endpoint:** `POST /v1/documents/process`
- **Purpose:** Upload raw, untagged course PDF for semantic remediation into accessible HTML and Tagged PDF.
- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
  - `file`: Binary PDF stream (max 50 MB)
  - `title`: String (Document human title)
  - `detect_tables`: Boolean (default `true`)
- **Response (HTTP 202 Accepted):**
```json
{
  "document_id": "doc_01jd93px7q...",
  "status": "PROCESSING",
  "page_count": 14,
  "created_at": "2026-11-14T10:01:00Z"
}
```

- **Endpoint:** `GET /v1/documents/{id}`
- **Purpose:** Retrieve document processing status, accessibility flags, and output URLs.
- **Response (HTTP 200 OK — `application/json`):**
```json
{
  "document_id": "doc_01jd93px7q...",
  "status": "COMPLETED",
  "accessible_html_url": "https://api.lumo-a11y.dev/v1/documents/doc_01jd93px7q/html",
  "tagged_pdf_url": "https://api.lumo-a11y.dev/v1/documents/doc_01jd93px7q/pdf",
  "metrics": {
    "headings_created": 18,
    "tables_tagged": 3,
    "images_flagged": 2
  },
  "flags": [
    {
      "type": "IMAGE_WITHOUT_ALT",
      "page": 3,
      "context": "Figure 1: Diagram showing network topology without text alternative"
    }
  ]
}
```

#### 3. Offline Package Generation
- **Endpoint:** `POST /v1/packages/generate`
- **Purpose:** Generate self-contained, low-bandwidth offline package for a lesson.
- **Request Body (JSON):**
```json
{
  "lesson_id": "lesson-01-python",
  "title": "Python Syntax and Variables",
  "video_url": "https://storage.platform.com/lessons/lesson-01.mp4",
  "captions_en_url": "https://storage.platform.com/captions/lesson-01-en.vtt",
  "captions_am_url": "https://storage.platform.com/captions/lesson-01-am.vtt"
}
```
- **Response (HTTP 202 Accepted):**
```json
{
  "package_id": "pkg_01jd93s4g2...",
  "status": "BUILDING",
  "download_url": "https://api.lumo-a11y.dev/v1/packages/pkg_01jd93s4g2/download",
  "created_at": "2026-11-14T10:02:00Z"
}
```

- **Endpoint:** `GET /v1/packages/{id}/download`
- **Purpose:** Download offline zip package.
- **Response (HTTP 200 OK — `application/zip`):** Stream of binary zip package.

#### 4. Source-Grounded Lesson Q&A (AI Educator)
- **Endpoint:** `POST /v1/lessons/{id}/ask`
- **Purpose:** Ask question strictly grounded in lesson transcript.
- **Request Body (JSON):**
```json
{
  "question": "What is the difference between a list and a tuple?",
  "language": "en",
  "session_id": "sess_99381..."
}
```
- **Response (HTTP 200 OK — `application/json`):**
```json
{
  "answer": "According to the lesson, a list is mutable (can be changed after creation using brackets [ ]), while a tuple is immutable (cannot be modified after creation, defined using parentheses ( )).",
  "citations": [
    {
      "timestamp_start": "00:14:22",
      "timestamp_end": "00:15:04",
      "excerpt": "Notice that unlike lists, tuples cannot be changed once defined..."
    }
  ],
  "confidence_score": 0.96
}
```

#### 5. Health & Diagnostic Check
- **Endpoint:** `GET /v1/health`
- **Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "storage": "connected",
  "ai_provider": "ollama_local",
  "timestamp": "2026-11-14T10:05:00Z"
}
```

### 5.3 Error Handling & HTTP Status Codes
All errors conform strictly to RFC 7807 problem details / unified JSON envelope:
```json
{
  "error": {
    "code": "MEDIA_UNREACHABLE",
    "message": "The provided video_url could not be fetched by the processing worker.",
    "details": { "http_status": 404, "target_url": "https://storage.platform.com/missing.mp4" }
  },
  "request_id": "req_01jd93w6k9",
  "timestamp": "2026-11-14T10:06:00Z"
}
```

| HTTP Code | Error Code | Description |
|---|---|---|
| 400 | `BAD_REQUEST` | Validation error in payload or unsupported file format |
| 401 | `UNAUTHORIZED` | Missing or invalid `X-Lumo-Key` header |
| 403 | `FORBIDDEN` | Tenant quota exceeded or resource belongs to another tenant |
| 404 | `NOT_FOUND` | Resource ID (caption, document, package) does not exist |
| 422 | `UNPROCESSABLE_ENTITY` | PDF file is corrupted or DRM-protected |
| 429 | `RATE_LIMITED` | Request rate limit exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled backend exception |
| 503 | `SERVICE_UNAVAILABLE` | Background processing worker queue is full |

---

## 6. Embed SDK Implementation Plan

The Embed SDK (`packages/embed-sdk`) compiles into a single, self-registering client JavaScript artifact (`lumo.min.js`) that encapsulates the Web Component definition, styles, icons, and keyboard orchestration.

### 6.1 Architecture & Lifecycle

```mermaid
sequenceDiagram
    participant Host as Host HTML Page
    participant SDK as lumo.min.js
    participant Registry as customElements Registry
    participant Component as <lumo-player> Instance
    participant Shadow as Shadow DOM Root

    Host->>SDK: <script src="lumo.min.js" defer>
    SDK->>SDK: Evaluate runtime & check capabilities
    SDK->>Registry: customElements.define('lumo-player', LumoPlayer)
    Host->>Component: DOM Parser creates <lumo-player>
    Component->>Component: connectedCallback()
    Component->>Shadow: attachShadow({ mode: 'open' })
    Component->>Shadow: Inject scoped player.css + template HTML
    Component->>Component: Parse attributes (src, captions, esl, ad)
    Component->>Component: Initialize KeyboardHandler & Announcer
    Component->>Host: Ready (emits 'lumo:ready')
```

### 6.2 Observed Attributes & Reactive Updates
`LumoPlayer` implements `observedAttributes`:
```typescript
static get observedAttributes(): string[] {
  return [
    'src',
    'poster',
    'title',
    'captions-en',
    'captions-am',
    'esl-src',
    'audio-description-src',
    'offline-enabled',
    'ai-educator',
    'lesson-id'
  ];
}

attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
  if (oldValue === newValue) return;
  switch (name) {
    case 'src':
      this.mediaController.updateSource(newValue);
      break;
    case 'captions-am':
    case 'captions-en':
      this.captionRenderer.loadTrack(name, newValue);
      break;
    case 'esl-src':
      this.eslController.setSource(newValue);
      break;
    case 'audio-description-src':
      this.adController.setSource(newValue);
      break;
  }
}
```

### 6.3 Event Emission Specification
Events are dispatched from the `<lumo-player>` element using `bubbles: true, composed: true` so host page scripts can listen directly:

| Event Name | Payload (`event.detail`) | Trigger Condition |
|---|---|---|
| `lumo:ready` | `{ version: string }` | Component mounted & Shadow DOM ready |
| `lumo:play` | `{ currentTime: number }` | Playback starts or resumes |
| `lumo:pause` | `{ currentTime: number }` | Playback paused |
| `lumo:seek` | `{ currentTime: number }` | User seeks via keyboard or slider |
| `lumo:captionchange` | `{ language: 'en'\|'am'\|'off', size: number }` | Language or size toggled |
| `lumo:eslopen` | `{ position: { x: number, y: number } }` | ESL window opened |
| `lumo:eslclose` | `void` | ESL window closed |
| `lumo:adtoggle` | `{ active: boolean }` | Audio description switched |
| `lumo:offline:ready` | `{ packageId: string, sizeBytes: number }` | Lesson cached for offline use |
| `lumo:error` | `{ code: string, message: string }` | Network, decoding, or parsing error |

### 6.4 Content Security Policy (CSP) Directives
Host platforms requiring strict CSP headers can integrate Lumo using the following rules without resorting to `unsafe-inline` or `unsafe-eval`:
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.lumo-a11y.dev;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  media-src 'self' blob: https://*.platform.com https://cdn.lumo-a11y.dev;
  connect-src 'self' https://api.lumo-a11y.dev https://cdn.lumo-a11y.dev;
```
*(Note: `'unsafe-inline'` in `style-src` is required only if the host does not use CSS nonces; Lumo styles within Shadow DOM do not inject top-level page stylesheets).*

### 6.5 Performance & Bundle Size Budget
- **Uncompressed Budget:** < 120 KB
- **Gzipped Budget:** < 40 KB (Target achieved: ~34.8 KB)
- **First Contentful Paint (FCP) Impact:** < 15ms
- **Memory Footprint:** < 12 MB heap allocation during 1080p playback

---

## 7. Data & Database Implementation

The Lumo server architecture uses **PostgreSQL 16** with strict Row-Level Security (RLS) to enforce tenant isolation. Client-side state is persisted via **IndexedDB** through a clean Promise-based wrapper.

### 7.1 PostgreSQL DDL Schema

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    allowed_domains JSONB DEFAULT '["*"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lessons Table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    video_url TEXT NOT NULL,
    audio_description_url TEXT,
    esl_video_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_lesson UNIQUE(tenant_id, external_id)
);

-- 3. Caption Tracks Table
CREATE TABLE caption_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL, -- 'en', 'am', 'om'
    vtt_url TEXT NOT NULL,
    source_type VARCHAR(50) DEFAULT 'HUMAN_VERIFIED', -- 'AI_GENERATED', 'HUMAN_VERIFIED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_lesson_lang UNIQUE(lesson_id, language_code)
);

-- 4. Processed Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    original_file_url TEXT NOT NULL,
    accessible_html_url TEXT,
    tagged_pdf_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    extraction_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Offline Packages Table
CREATE TABLE offline_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    package_url TEXT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Row-Level Security Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE caption_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_lessons ON lessons
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_documents ON documents
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 7.2 Client-Side IndexedDB Schema
Database Name: `LumoA11yDB` · Version: `1`

#### Object Store: `lessons`
- **Primary Key:** `lessonId` (string)
- **Indexes:** `downloadedAt`, `status`
- **Schema:**
```typescript
interface IDBLessonRecord {
  lessonId: string;
  title: string;
  audioBlob: Blob;
  captionsEnVtt: string;
  captionsAmVtt: string;
  transcriptHtml: string;
  manifest: {
    version: string;
    checksum: string;
    totalSizeBytes: number;
  };
  lastAccessed: number;
}
```

#### Object Store: `user_preferences`
- **Primary Key:** `key` (string)
- **Values:**
  - `caption_size`: `100 | 150 | 200`
  - `caption_color`: `'white-black' | 'yellow-black' | 'black-white'`
  - `caption_lang`: `'en' | 'am' | 'off'`
  - `esl_coordinates`: `{ x: number, y: number, width: number, height: number }`
  - `playback_speed`: `number`

---

## 8. AI Implementation Plan

The AI architecture is strictly optional, source-grounded, and decoupled. If the AI service is disabled or offline, all core accessibility features (video, audio, captions, ESL, offline packages, document processing) remain 100% operational.

### 8.1 LLM Provider Abstraction
```python
# services/api/app/services/ai/base.py
from abc import ABC, abstractmethod
from typing import AsyncIterable, Dict, Any, List

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self, 
        prompt: str, 
        context: List[str], 
        system_prompt: str
    ) -> str:
        """Generate complete text response grounded in context."""
        pass

    @abstractmethod
    async def stream_response(
        self, 
        prompt: str, 
        context: List[str], 
        system_prompt: str
    ) -> AsyncIterable[str]:
        """Stream token-by-token response for live chat drawer."""
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """Check availability of AI backend."""
        pass
```

### 8.2 Local Open-Source Implementation (Default)
Lumo connects by default to a self-hosted **Ollama** instance running **Qwen2.5-7B-Instruct** or **Llama 3.1 8B Instruct** (4-bit quantized).
- **Zero API Key Requirement:** No OpenAI, Anthropic, or external API keys needed.
- **Hardware Requirement:** 8 GB RAM, 4 CPU cores (runs on a $20/month VPS).
- **Prompt Grounding (Anti-Hallucination):**
```text
You are the Lumo AI Lesson Tutor. Your duty is to help learners understand course material.
CRITICAL CONSTRAINT: You must answer the learner's question ONLY using the provided lesson transcript excerpts below.
If the answer cannot be found in the transcript, reply:
"I cannot find the answer to that in this lesson. Please consult your course instructor."
Never invent facts, code examples, or explanations outside the transcript.
Always cite the timestamp of the relevant excerpt in the format [MM:SS].
```

### 8.3 Ethiopian Language Strategy
1. **English:** Handled directly by Qwen2.5 / Llama 3.1.
2. **Amharic:**
   - Evaluated models indicate Qwen2.5-7B has significantly stronger Ge'ez tokenization and Amharic comprehension than Llama.
   - Dual-path routing: If native Amharic output confidence is low, the pipeline executes an internal bridge:
     1. Retrieve Amharic transcript excerpts.
     2. Reason across context.
     3. Translate generation via local **NLLB-200** (No Language Left Behind) open-source translation model.
3. **Speech Services:**
   - **Speech-to-Text:** OpenAI Whisper (Local, Medium model) — excellent Amharic phoneme recognition.
   - **Text-to-Speech:** Coqui TTS (Open source) — English default; Amharic experimental.

---

## 9. Offline Implementation Plan

The offline module guarantees that a learner in rural Ethiopia with no connectivity can study course materials on an affordable Android device.

### 9.1 Package Size Budget (< 10 MB Total)

| Component | Format / Encoding | Size Budget | Purpose |
|---|---|---|---|
| Audio Track | MP3, 64 kbps CBR, Mono, 44.1 kHz | ~4.5 MB | Complete 45-min spoken lecture audio |
| English Captions | WebVTT UTF-8 | ~22 KB | Synchronized English subtitles |
| Amharic Captions | WebVTT UTF-8 (Fidel glyphs) | ~28 KB | Synchronized Amharic subtitles |
| Plain Transcripts | Plain Text UTF-8 | ~18 KB | Searchable complete lesson text |
| Offline Player | Standalone Single-File HTML/CSS/JS | ~24 KB | Zero-dependency accessible media UI |
| Manifest | JSON + SHA-256 Hashes | ~2 KB | Integrity verification & versioning |
| **Total Size** | **Compressed Zip** | **~4.6 MB** | **Well within 10 MB hard gate** |

### 9.2 Service Worker Caching Lifecycle
```typescript
// packages/offline/src/sw.ts
const CACHE_NAME = 'lumo-offline-v1';
const APP_SHELL = [
  '/',
  '/v1/lumo.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600&display=swap'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // 1. Intercept offline lesson packages
  if (url.pathname.startsWith('/offline-packages/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for application shell
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || networkPromise;
    })
  );
});
```

### 9.3 Package Verification & Integrity Check
Before storing or mounting an offline package, `PackageDownloader.ts` extracts the manifest and computes the SHA-256 digest of every file using `crypto.subtle.digest('SHA-256', buffer)`. If any checksum fails, the package is quarantined, deleted, and an accessible alert is announced.

---

## 10. Testing Strategy & Automated Gates

Lumo implements an uncompromising, multi-layered quality assurance matrix combining automated CI assertions, screen-reader driver scripts, and low-bandwidth network simulation.

### 10.1 Automated Accessibility Pipeline (axe-core Gate)
Any pull request that introduces an accessibility violation is automatically blocked by GitHub Actions:

```typescript
// tests/a11y/axe-player.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('LumoPlayer Automated Accessibility Gate', () => {
  test('should have zero axe-core violations across all player states', async ({ page }) => {
    await page.goto('/demo/player');
    await page.waitForSelector('lumo-player');

    // 1. Initial Loaded State
    let accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // 2. Playing State with Amharic Captions Active
    await page.keyboard.press('Space'); // Start playback
    await page.keyboard.press('KeyC');  // Toggle captions
    accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // 3. ESL Window Open & Focused
    await page.keyboard.press('KeyS'); // Open ESL window
    accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### 10.2 Manual Screen Reader Matrix

| OS / Platform | Screen Reader | Browser | Required Verification Behaviors |
|---|---|---|---|
| **Windows 11** | NVDA 2024.3 | Google Chrome 130 | - Play/pause announces state toggles<br>- Seek slider announces time in minutes & seconds<br>- Captions language changes are announced<br>- Amharic text does not crash NVDA speech synthesis |
| **Windows 11** | JAWS 2024 | MS Edge 130 | - Virtual cursor navigates toolbar buttons correctly<br>- Dialog role for ESL window traps virtual focus appropriately |
| **Android 14** | TalkBack 14.1 | Chrome Mobile | - Swipe-right traverses controls in logical order<br>- Touch targets meet 48x48dp minimum<br>- Double-tap toggles playback reliably |
| **macOS 15** | VoiceOver | Safari 18 | - VO+Space triggers controls<br>- Live regions announce status without interrupting main content |

### 10.3 200% Zoom & Reflow Audit
- Viewport set to 1280x1024 at 200% browser zoom (equivalent CSS width: 640px).
- Verify:
  1. Controls bar wraps into two distinct rows without overlapping buttons.
  2. Caption box text scales proportionally without breaking outside the video bounds.
  3. No horizontal scrollbar appears on the root document.
  4. ESL window automatically scales down or docks to prevent obscuring the main player controls.

### 10.4 3G & Offline Network Throttling
- Emulate Slow 3G profile in Playwright / Chrome DevTools:
  - Download throughput: 500 kbps
  - Upload throughput: 500 kbps
  - Latency (RTT): 400 ms
- Assertions:
  - Video poster and initial controls render in < 1.2 seconds.
  - Video stream buffers with accessible loading spinner (`aria-label="Buffering video"`).
  - Offline package download displays progress bar with periodic `aria-live` updates (at 25%, 50%, 75%, 100%).

---

## 11. Real-User Testing Protocol

Lumo's testing protocol is anchored in the **Co-Design Framework** established by Hussein Ali (Ubongo International) in Hackathon Session 1: *"Nothing about us without us."* Co-designers are equal design partners and domain experts in their lived experience.

### 11.1 Ethics, Voluntary Consent & Safety Guidelines
1. **Voluntary Participation & Consent:** Every participant must review and sign the Plain Language Consent Form (available in English, Amharic, or conveyed via certified EthSL interpreter).
2. **Right to Withdraw:** Participants may pause, skip tasks, or withdraw at any moment without penalty or loss of compensation.
3. **Trauma-Informed Practice:** Displaced individuals and refugees must never be asked about past trauma, asylum status, or personal history. Interactions focus exclusively on software usability.
4. **Compensation & Dignity:** Co-designers are compensated honorably for their consultation time and acknowledged by name in repository credits (with explicit opt-in).
5. **Data Minimization:** No biometric, voice, or facial recordings are retained without explicit written media release consent.

#### Plain Language Consent Form Template
```markdown
# Participant Consent Form — Digital Bridge Hackathon 2026
**Project:** Lumo Accessible Media Module
**Lead Researchers:** Lumo Engineering Team

1. I understand that I am participating in a research session to test learning media tools.
2. I understand that my participation is completely voluntary and I can stop at any time.
3. I understand that the researchers are testing their software, NOT testing me or my abilities.
4. I agree / do not agree to have screen actions and anonymized notes recorded.
5. I agree / do not agree to have my name credited in the open-source project contributors list.

Participant Signature / Video Sign Affirmation: ____________________ Date: ____________
Interpreter Name (if applicable): ________________________________
```

### 11.2 The 7-Step Hackathon Co-Design Loop
```mermaid
flowchart LR
    A["1. Ask<br/>(Observe current flow)"] --> B["2. Work through<br/>(Sketch solution)"]
    B --> C["3. Check-in<br/>(Validate concept)"]
    C --> D["4. Test<br/>(On learner's device)"]
    D --> E["5. Fix / Change<br/>(Remediate code)"]
    E --> F["6. Retest<br/>(Confirm resolution)"]
    F --> G["7. Pitch & Ship<br/>(With co-designer)"]

    style A fill:#2d3748,stroke:#4a5568,color:#fff
    style D fill:#c53030,stroke:#e53e3e,color:#fff
    style E fill:#2b6cb0,stroke:#3182ce,color:#fff
    style F fill:#319795,stroke:#38b2ac,color:#fff
```

### 11.3 Persona-Specific Testing Tasks

#### Task 1: Hana (Deaf Learner, Tecno Spark 10 Android)
- **Goal:** Watch a 5-minute technical lesson and review the material without audio.
- **Scenario:** "You are studying lesson 1. You cannot hear the instructor. You want to see the Ethiopian Sign Language interpreter and read Amharic subtitles at a comfortable size."
- **Success Criteria:**
  1. Activates Amharic captions in under 15 seconds.
  2. Opens the ESL window; resizes or repositions it so it does not block the slide text.
  3. Adjusts caption size to 150% without text overflowing the screen.
  4. Opens the interactive transcript to inspect a previously spoken term.
  5. Completes the session 100% unaided.

#### Task 2: Tesfaye (Blind Learner, Windows 11 + NVDA)
- **Goal:** Complete a full lesson cycle using keyboard and screen reader exclusively.
- **Scenario:** "You cannot see the screen. Using only your keyboard and NVDA, start the lesson, skip forward past the introduction, enable audio description, and download the lesson for home study."
- **Success Criteria:**
  1. Locates the player via Tab navigation or landmark `role="region"`.
  2. Starts playback with `Spacebar`; confirms NVDA announces "Play video".
  3. Seeks forward 30 seconds using `Right Arrow` or forward button; hears formatted time announcement.
  4. Toggles Audio Description (`D` key); hears confirmation announcement and described video track.
  5. Triggers "Download for offline"; receives audible notification when package is ready.
  6. Zero keyboard traps encountered.

#### Task 3: Rahel (Motor Disability, Desktop Keyboard Only)
- **Goal:** Operate media controls and reposition floating windows without a mouse.
- **Scenario:** "You cannot use a mouse. Open the sign language window and move it to the upper-left corner of the screen using only your keyboard."
- **Success Criteria:**
  1. Presses `S` to launch ESL window; focus shifts into the dialog.
  2. Uses `Arrow Keys` to move window coordinates; hears position feedback.
  3. Closes dialog using `Escape`; focus cleanly returns to `btn-esl`.

#### Task 4: Dawit (Cognitive / Dyslexia, Tecno Pop 7 Android)
- **Goal:** Comprehend dense programming instructions without cognitive overload.
- **Scenario:** "The instructor is speaking too fast. Slow down playback, choose yellow-on-black high-contrast captions, and replay the last 10 seconds."
- **Success Criteria:**
  1. Changes playback speed to 0.75x in under 20 seconds.
  2. Selects high-contrast yellow-on-black caption preset.
  3. Uses 10-second skip back button to review missed concept.

#### Task 5: Amira (Refugee / Low-Bandwidth, 3G Offline)
- **Goal:** Access learning content with zero active internet connection.
- **Scenario:** "You have 5 minutes of Wi-Fi before traveling to an area with no reception. Prepare this lesson to study at home."
- **Success Criteria:**
  1. Clicks "Download for offline"; package completes in under 3 minutes on simulated 3G.
  2. Device placed into Airplane Mode (100% disconnected).
  3. Opens cached lesson; audio plays clearly with full transcript and Amharic captions visible.

### 11.4 Observation Sheet & Severity Classification
Each observation during testing is logged in the following matrix:

| Field | Description / Value |
|---|---|
| **Test Run ID** | `RUN-20261114-01` |
| **Participant ID** | `P02-Tesfaye` |
| **Assistive Tech** | NVDA 2024.3 + Chrome 130 (Windows 11) |
| **Task ID** | `TASK-2` (Audio Description & Keyboard Seek) |
| **Completion Status** | `Pass` / `Fail` / `Pass with Friction` |
| **Time to Complete** | 1 minute 42 seconds |
| **Assistance Given** | None (Independent) |
| **Think-Aloud Quotes** | *"The seek slider announced 'one minute twenty seconds' clearly. The AD toggle was easy to find."* |
| **Observed Friction** | Focus ring on the speed button could have slightly higher contrast against the dark background. |
| **Severity Level** | **P3 (Minor Polish)** |

#### Severity Levels:
- **P0 — Blocker (Gate Failure):** Task cannot be completed; screen reader crashes; keyboard trap freezes user; essential content uncaptioned.
- **P1 — Critical:** Task completed only with extreme difficulty, workarounds, or accidental actions; font unreadable.
- **P2 — Significant:** Task completed but with noticeable confusion or unexpected UI behavior.
- **P3 — Minor:** Cosmetic flaw, slightly low focus contrast, or phrasing suggestion that does not impede progress.

### 11.5 Rapid Remediation Protocol
- Any **P0** or **P1** issue halts new feature development immediately.
- Triage window: **< 30 minutes**.
- Fix deployed to test branch: **< 90 minutes**.
- Re-tested with co-designer before final sign-off.

---

## 12. Savanna Integration Walkthrough

This walkthrough proves how an engineer at ALX can integrate Lumo into `Savanna-static-pages` in under 5 minutes without altering existing backend or styling assets.

### 12.1 Step-by-Step Implementation

#### Step 1: Open Target Lesson Template
In `Savanna-static-pages`, locate the HTML lesson template (e.g., `templates/course-lesson.html`).

#### Step 2: Inject Font & Lumo Embed Script into `<head>`
Add the Google Fonts preconnect for Noto Sans Ethiopic and the Lumo SDK script tag:
```html
<head>
  <!-- Existing Savanna Meta & Styles -->
  <link rel="stylesheet" href="../css/savanna-core.css">

  <!-- LUMO ACCESSIBILITY INJECTION (Step 2) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.lumo-a11y.dev/v1/lumo.min.js" defer></script>
</head>
```

#### Step 3: Replace Standard `<video>` with `<lumo-player>`
Locate the existing video container:

```html
<!-- BEFORE: Existing Inaccessible Savanna Video Tag -->
<div class="video-wrapper">
  <video src="https://cdn.alxafrica.com/lessons/module-01.mp4" controls></video>
</div>
```

Replace with:

```html
<!-- AFTER: Lumo Accessible Drop-In Component -->
<div class="video-wrapper">
  <lumo-player
    src="https://cdn.alxafrica.com/lessons/module-01.mp4"
    poster="https://cdn.alxafrica.com/lessons/module-01-poster.jpg"
    title="Module 1: Foundations of Problem Solving"
    captions-en="https://cdn.alxafrica.com/captions/module-01-en.vtt"
    captions-am="https://cdn.alxafrica.com/captions/module-01-am.vtt"
    esl-src="https://cdn.alxafrica.com/esl/module-01-esl.mp4"
    audio-description-src="https://cdn.alxafrica.com/ad/module-01-ad.mp4"
    offline-enabled="true">
  </lumo-player>
</div>
```

#### Step 4: Verification via Developer Tools
1. Open the page in Google Chrome.
2. Open Chrome DevTools -> Elements. Verify `<lumo-player>` contains `#shadow-root (open)`.
3. Open the **Axe DevTools** extension. Click "Scan all of my page". Verify **0 Issues**.
4. Disconnect your mouse. Press `Tab` to navigate to the Play button; press `Space` to begin playback.

### 12.2 Two-Minute Rollback Procedure
If any incompatibility is detected:
1. Revert `course-lesson.html` using Git:
   ```bash
   git checkout templates/course-lesson.html
   ```
2. Or manually remove the script/font tags from `<head>` and revert `<lumo-player>` back to `<video controls>`.
3. Save and refresh. Zero database state, orphaned files, or cookies are left behind.

### 12.3 Integration Troubleshooting Playbook

| Symptom | Root Cause | Exact Remedy |
|---|---|---|
| **Captions do not appear when toggled** | Host media server lacks CORS header for `.vtt` files | Add `Access-Control-Allow-Origin: *` to the caption server CDN or host `.vtt` on same domain |
| **Amharic Fidel characters display as squares (tofu)** | Host CSP blocks external Google Fonts CDN | Include `https://fonts.googleapis.com` and `https://fonts.gstatic.com` in `style-src` / `font-src`, or bundle WOFF2 files locally |
| **ESL toggle button is missing from toolbar** | Attribute `esl-src` was omitted or empty | Provide a valid URL to the interpreter video; Lumo gracefully hides the button when no track is supplied |
| **Offline download fails with network error** | Page served over plain HTTP (`http://`) | Service Workers require HTTPS; run on `https://` or `localhost` |
| **Player styling conflicts with Savanna CSS** | Global reset CSS rules in host page leaking | Lumo uses Shadow DOM (`mode: 'open'`) which shields all internal buttons from host CSS resets |

---

## 13. Web Implementation Plan

The web reference application (`apps/web`) serves as the live evaluation environment for judges, developers, and co-designers.

### 13.1 Route Architecture

```
/                                  -> Landing Page (Mission, Architecture, Live Quick Start)
├── /demo                          -> Interactive Demonstration Hub
│   ├── /demo/player               -> Standalone Accessible Player
│   ├── /demo/captions             -> Dual English/Amharic Captions & Typography Controls
│   ├── /demo/esl                  -> Movable & Resizable EthSL Window Demonstration
│   ├── /demo/offline              -> Offline Package Download & Airplane Mode Simulator
│   └── /demo/documents            -> Untagged PDF to Accessible Semantic HTML Converter
├── /jobs                          -> Career Gateway (Accessible Job Card @ 200% Zoom)
├── /docs                          -> Developer Documentation & Guides
│   ├── /docs/quick-start          -> 5-Minute Setup Guide
│   ├── /docs/savanna              -> Savanna Step-by-Step Guide
│   └── /docs/accessibility        -> Formal WCAG 2.2 AA Conformance Statement
└── /api-docs                      -> Interactive Swagger UI / OpenAPI 3.1.0 Explorer
```

### 13.2 Career Gateway Component (`/jobs`)
To satisfy the mandatory hackathon career gateway requirement:
- Displays an accessible tech employment job card (e.g., "Junior Accessibility QA Tester — ALX Ethiopia").
- **Audio Summary Feature:** Dedicated `<button aria-label="Listen to job summary">` streaming high-clarity TTS audio synopsis.
- **200% Zoom Hardening:** Layout built with fluid CSS grid (`minmax(280px, 1fr)`) and `rem` units. At 200% zoom, all requirements, salary, and apply buttons remain 100% visible with zero horizontal scroll.
- **Structured Data:** Inlines JSON-LD adhering to `schema.org/JobPosting` with `accessibilityFeature` extensions.
- **Verifiable Credential Link:** Displays a mock Open Badges 3.0 verifiable badge link confirming course completion with accessibility accommodations.

---

## 14. Telegram Bot Implementation Plan

*(Marked strictly as a Future Phase / Post-Core Extension — execution commences only after web and core modules are fully validated).*

### 14.1 Architecture & API Reuse
The Telegram Bot (`apps/telegram-bot`) is built with Python 3.11 using **aiogram 3.x**. It contains **zero independent business logic**; it acts purely as a conversational client to the Lumo FastAPI backend via `X-Lumo-Key`.

```mermaid
graph LR
    User[Learner on Telegram] --> Bot[Lumo Telegram Bot]
    Bot --> API[FastAPI /v1 Services]
    API --> Packages[Offline Audio & Transcripts]
    API --> AI[Source-Grounded Q&A]
```

### 14.2 Bot Command Set
- `/start` — Welcome message, language selection (English / Amharic), audio overview.
- `/lesson <id>` — Streams speech-compressed MP3 audio (64kbps) directly into chat with inline captions.
- `/transcript <id>` — Delivers searchable text transcript as formatted Telegram message or downloadable `.txt`.
- `/ask <question>` — Queries `POST /v1/lessons/{id}/ask` and replies with citation timestamps.
- `/offline <id>` — Delivers direct download link for offline zip package.

### 14.3 Accessibility Boundaries in Telegram
- **Limitation:** Telegram native client cannot render custom Web Components or floating video overlays.
- **Accommodation Model:** Shifts from video-first to **audio + text transcript first**.
- All messages formatted with clean markdown, semantic numbering, and zero text embedded inside flat image cards.

---

## 15. Documentation Plan

The repository includes a comprehensive, publication-grade documentation suite:

### 15.1 Suite Inventory
1. **`README.md` (Root):**
   - Badges: CI Status, WCAG 2.2 AA Pass, axe-core 0 violations, License: MIT.
   - 30-second elevator pitch & architecture diagram.
   - One-line script tag snippet.
   - Quick links to live demos and API docs.
2. **`docs/quick-start.md`:** 5-step integration guide under 500 words for developers.
3. **`docs/savanna-integration.md`:** Step-by-step instructions for ALX engineers.
4. **`docs/api-reference.md`:** OpenAPI endpoint reference with copy-paste `curl` examples.
5. **`docs/one-hour-challenge.md`:** Self-guided 45-minute testing challenge for hackathon judges.
6. **`docs/accessibility-statement.md`:** Formal W3C WCAG 2.2 AA Conformance Statement detailing VPAT/conformance claim, tested user agents, and assistive technology configurations.
7. **`docs/privacy-policy.md`:** Zero-telemetry, zero-tracking architectural guarantee.

---

## 16. Deployment & Operations

### 16.1 Production Multi-Container Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # 1. Reverse Proxy & CDN Edge Simulator
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./packages/embed-sdk/dist:/usr/share/nginx/html/cdn:ro
    depends_on:
      - api
      - web

  # 2. Next.js Reference Web App
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.lumo-a11y.dev/v1
    expose:
      - "3000"

  # 3. FastAPI Backend
  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://lumo:lumopass@db:5432/lumo_db
      - REDIS_URL=redis://redis:6379/0
      - OLLAMA_HOST=http://ollama:11434
    expose:
      - "8000"
    depends_on:
      - db
      - redis

  # 4. Asynchronous Media & Document Processing Worker
  worker:
    build:
      context: ./services/media-processor
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://lumo:lumopass@db:5432/lumo_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  # 5. PostgreSQL Database
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=lumo
      - POSTGRES_PASSWORD=lumopass
      - POSTGRES_DB=lumo_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    expose:
      - "5432"

  # 6. Redis Queue & Cache
  redis:
    image: redis:7-alpine
    expose:
      - "6379"

  # 7. Local Open-Source LLM Server (Ollama)
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollamadata:/root/.ollama
    expose:
      - "11434"

volumes:
  pgdata:
  ollamadata:
```

### 16.2 Operating Cost Model (< $15 / Month)

| Resource | Provider & Tier | Monthly Cost | Scaling Limit |
|---|---|---|---|
| **API & Web Host** | Hetzner Cloud CX21 (2 vCPU, 4 GB RAM) | $5.80 | Supports up to 50,000 monthly active learners |
| **Object Storage** | Wasabi S3 (1 TB Standard Tier, Zero Egress) | $5.99 | 1,000+ full offline lesson packages |
| **CDN & DNS** | Cloudflare Free Tier (Global Edge Cache) | $0.00 | Unlimited embed script downloads |
| **Domain & SSL** | Namecheap `.dev` + Cloudflare Universal SSL | $1.00 (amortized) | Annual renewal |
| **Database** | PostgreSQL on same Hetzner VPS | $0.00 | Contained within server resource |
| **AI Processing** | Self-hosted Ollama on local/VPS worker | $0.00 | Zero third-party API token fees |
| **TOTAL** | | **$12.79 / month** | **Completely sustainable for non-profits & ALX** |

---

## 17. Risk Register & Contingency Playbook

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy | Contingency Plan |
|---|---|---|---|---|---|
| **R-01** | Certified EthSL interpreter recording unavailable for hackathon demo | High | High | Partner with ENAD early; prepare sample lesson interpreter clip | Display sample certified interpreter video; provide architecture for uploading content |
| **R-02** | Android Chrome font render engine fails to download Noto Sans Ethiopic | High | Low | Inject preconnect headers and `font-display: swap` | Bundle fallback lightweight Ethiopic SVG/WOFF2 font subset inside SDK |
| **R-03** | `axe-core` flags dialog accessibility violations on ESL window | Critical | Medium | Follow WAI-ARIA Authoring Practices 1.2 Modal Dialog pattern exactly | Shift dialog into a docked bottom panel with `role="region"` |
| **R-04** | Service Worker registration blocked by browser private mode | Medium | Medium | Test with standard Chrome profiles; graceful fallback | Fall back to direct HTTP file download link for offline zip |
| **R-05** | Amharic translation in AI Educator hallucinates inaccurate advice | High | Medium | Strict system prompt grounding on lesson transcript only | Disable generative responses; return verbatim transcript excerpts with timestamps |
| **R-06** | 3G network simulation fails to stream full MP4 video | High | High | Implement adaptive poster + audio-only stream fallback | Prompt user to switch to "Low Bandwidth Audio Mode" |
| **R-07** | Savanna page CSP restricts loading external script from CDN | Critical | Low | Provide self-hosting documentation and inline bundle instructions | Deliver `lumo.min.js` directly within Savanna's `assets/js/` directory |
| **R-08** | Screen reader reads both main video audio and AD text simultaneously | Medium | Medium | Pause main audio briefly when WebVTT text AD cue fires | Use dedicated described video audio track as primary solution |
| **R-09** | Heavy PDF document causes extraction worker timeout | Medium | Low | Set 50 MB limit and page limit (max 50 pages) in Pydantic schema | Return asynchronous webhook response; stream partial HTML |
| **R-10** | Co-designer encounters unexpected keyboard trap during live judging | Critical | Low | Run automated keyboard traversal Playwright tests before every build | Provide single emergency shortcut (`Escape` x 2) restoring focus to page root |

---

## 18. Prioritization Matrix (P0 / P1 / P2 / P3)

Derived strictly from Section 24 of `blueprint.md`:

### P0 — Non-Negotiable Gate Requirements (Pass/Fail)
- [ ] Accessible Media Player Web Component (`<lumo-player>`) with complete ARIA toolbar.
- [ ] 100% keyboard navigation (Space, Arrows, C, S, D, Tab) with visible focus rings.
- [ ] Dual-language captions (English & Amharic) rendered via WebVTT with Noto Sans Ethiopic font.
- [ ] Caption adjustments: 100%, 150%, 200% font size; high-contrast color presets.
- [ ] Ethiopian Sign Language (ESL) movable, resizable, keyboard-accessible dialog window.
- [ ] Audio Description toggle switching between standard and described video tracks.
- [ ] Low-bandwidth offline package generator producing audio + transcript + HTML (< 10 MB).
- [ ] Fully operational offline HTML player running without network.
- [ ] Accessible Document Processor producing semantic HTML from PDF.
- [ ] One-line script tag embed operating inside Savanna static HTML pages.
- [ ] Zero critical, zero serious issues in `axe-core` automated scans.
- [ ] Formal WCAG 2.2 AA Conformance Report submitted.
- [ ] Real-user testing session with persons with disabilities documented.

### P1 — Production-Grade Product Standards
- [ ] FastAPI backend with documented REST endpoints for captions, documents, and packages.
- [ ] Interactive OpenAPI 3.1.0 documentation published at `/docs`.
- [ ] Career Gateway accessible job card with audio summary and 200% zoom hardening.
- [ ] Developer Quick Start guide (< 500 words) and Savanna integration guide.
- [ ] Automated CI/CD pipeline enforcing accessibility gates on pull requests.

### P2 — Valuable High-Impact Extensions
- [ ] Source-grounded AI Educator conversational drawer (English text-only, Ollama-powered).
- [ ] Caption vertical positioning override (top / bottom).
- [ ] Keyboard repositioning coordinates for ESL window (`Arrow Keys`).
- [ ] Package SHA-256 integrity auto-verification and update notification.
- [ ] LTI 1.3 registration configuration endpoint (`/lti/config`).

### P3 — Future Strategic Roadmap (Post-Hackathon)
- [ ] AI 3D educator character with VRM viseme lip-synchronization.
- [ ] Native Amharic and Afaan Oromo conversational speech AI.
- [ ] Braille export format (`.brf`) generator.
- [ ] Telegram Bot delivery channel (`apps/telegram-bot`).
- [ ] Verifiable Open Badges 3.0 cryptographic signing.
- [ ] Regional EthSL dialect variations support.

---

## 19. Final Delivery Checklist & Judging Alignment

### Category 1: Works for the People (30 Points)
- [ ] **Evidence 1.1:** Co-designer with lived experience completes lesson learning task unaided on their own device.
- [ ] **Evidence 1.2:** Automated `axe-core` scan outputs **0 violations** across all modules.
- [ ] **Evidence 1.3:** Formal `WCAG_2.2_AA_Conformance_Report.md` included in repository.
- [ ] **Evidence 1.4:** NVDA + Chrome and TalkBack + Android screen-reader test videos recorded and linked.
- [ ] **Evidence 1.5:** Sound-off evaluation confirms 100% visual parity via Amharic captions and ESL window.

### Category 2: Platform Adoption & Ease of Integration (25 Points)
- [ ] **Evidence 2.1:** Drop-in integration proven in `alx-africa/Savanna-static-pages` with a 3-line git diff.
- [ ] **Evidence 2.2:** One-Hour Integration Challenge verified: independent evaluator completes setup in < 40 minutes.
- [ ] **Evidence 2.3:** Live interactive Swagger UI available at `https://api.lumo-a11y.dev/docs`.
- [ ] **Evidence 2.4:** Single-file SDK bundle (`lumo.min.js`) strictly under 40 KB gzipped.
- [ ] **Evidence 2.5:** Clean 2-minute rollback procedure documented with zero leftover state.

### Category 3: Ethiopian Context & Localization (15 Points)
- [ ] **Evidence 3.1:** Amharic Ethiopic Fidel typography rendered with Noto Sans Ethiopic and line-height 1.65 (LTR enforced).
- [ ] **Evidence 3.2:** Movable Ethiopian Sign Language window synchronized to video clock.
- [ ] **Evidence 3.3:** Offline package download tested on low-cost Android device with total footprint < 8 MB.
- [ ] **Evidence 3.4:** Tested on Android 8+ Tecno / Samsung hardware over simulated 3G.

### Category 4: Code Quality, Privacy & Security (15 Points)
- [ ] **Evidence 4.1:** Architectural guarantee: zero telemetry calls during media playback.
- [ ] **Evidence 4.2:** Strict CSP compliance without `unsafe-eval`.
- [ ] **Evidence 4.3:** Shadow DOM style encapsulation preventing CSS leaks into or out of host pages.
- [ ] **Evidence 4.4:** Clean TypeScript code with 100% type safety and modular directory separation.

### Category 5: Sustainability & Open-Source Feasibility (15 Points)
- [ ] **Evidence 5.1:** Documented monthly infrastructure operating cost of **~$12.79 / month**.
- [ ] **Evidence 5.2:** Complete independence from commercial, per-token paid AI APIs.
- [ ] **Evidence 5.3:** Turnkey production deployment via `docker-compose up -d`.
- [ ] **Evidence 5.4:** Open-source MIT License applied with team attribution.

---

*End of Implementation Plan · Lumo Accessibility Infrastructure Module · Digital Bridge Hackathon 2026*
