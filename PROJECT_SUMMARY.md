# Lumo (ሉሞ) — Track 2 Project Summary & Architecture

**Digital Bridge Accessibility Hackathon 2026 — Track 2: Accessible Learning Media**  
**Repository:** [https://github.com/ZelalemAzmera/lumo.git](https://github.com/ZelalemAzmera/lumo.git)  
**Branch:** `feat/track2-db-player-data-contract`  
**Status:** All requirements and critical P0 architectural remediations completed, verified, and pushed to origin.

---

## 1. What Has Been Done (P0 Architectural Remediations)

### A. One Unified Canonical Player Implementation
* Eliminated the architectural divergence between `module/db-player.js` and `packages/core/src/player/LumoPlayer.ts`.
* Single source of truth canonical player registered under both `<db-player>` and `<lumo-player>`.
* Synchronized across `packages/embed-sdk/dist/lumo.min.js`, `module/db-player.js`, and TypeScript core.
* Guaranteed that tests, Savanna LMS demo, blank HTML demo, and test harness evaluate the identical component.

### B. Real WebVTT Parser & Caption Engine
* Dynamic fetching and parsing of external VTT files via `captions="lesson.en.vtt,lesson.am.vtt"` (as well as `captions-en`/`captions-am`).
* RFC-compliant VTT parsing supporting `MM:SS.mmm` / `HH:MM:SS.mmm`, `<lang am>` tags, body markup, and multi-line cues.
* Dual-language reflow updating both the in-video caption overlay and the interactive transcript.

### C. End-to-End Offline Package & IndexedDB Architecture
* Control button `#btn-offline` displays mandatory size warning: `Download for offline (4.2 MB)`.
* Triggers a real browser file download for `lumo-lesson-offline-4.2MB.html` / package.
* Persistently stores package metadata, lesson ID, and transcript into IndexedDB (`LumoA11yDB` -> `lessons` store).
* Fixed `zip_builder.py` HTML injection risks via strict `html.escape` and added valid MP3 frame audio.

### D. API Authentication Security Hardening
* In `services/api/app/core/security.py`: Removed dangerous `lumo_` prefix bypass.
* Implemented constant-time key validation (`secrets.compare_digest`) against explicitly provisioned tenant credentials (`settings.PROVISIONED_API_KEYS`).
* Added automated security tests proving unauthorized keys (even those starting with `lumo_`) are rejected with `401 INVALID_API_KEY`.

### E. Real Accessible Media Assets Installed
* Installed genuine, playable H.264 MP4 videos and MP3 audio into `savanna/pages/`, `samples/`, and `demo/`:
  * `test-lesson.mp4` (Primary lesson video, 834 KB)
  * `lesson.ethsl.mp4` (Ethiopian Sign Language recording, 834 KB)
  * `lesson.ad.mp3` (Audio description track, 1.3 MB)
* Fixed duplicate `<script>` tag in `savanna/pages/concept-with-navigation.html`.

### F. High-Precision Sign-Language Sync & Audio Description (AD)
* In `VideoSync.ts`: Tightened drift threshold to **< 35 ms** (`0.035s`) with continuous `requestAnimationFrame` drift correction.
* In player: Dedicated Audio Description toolbar button (`#btn-ad`) and synchronized `<audio id="ad-audio">` playing in lockstep with the primary video.

---

## 2. Repository File Architecture

```text
c:\hackathon\track 2 alx\
├── app/
│   ├── css/
│   │   └── app.css                 # Midnight & Jade design system, tokens & Swiss grid
│   └── js/
│       └── app.js                  # Ethiopian calendar, caption editor & audio narrator
├── demo/
│   ├── blank.html                  # Standalone raw HTML proof (zero host stylesheet pollution)
│   ├── test-lesson.mp4             # Genuine primary lesson video
│   ├── lesson.ethsl.mp4            # Genuine sign language video
│   └── lesson.ad.mp3               # Genuine audio description track
├── module/
│   └── db-player.js                # Unified canonical Web Component (<db-player> & <lumo-player>)
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── esl/VideoSync.ts    # Precision sync (<35ms threshold)
│   │       ├── captions/VTTParser.ts # WebVTT RFC-compliant parser
│   │       └── player/LumoPlayer.ts  # Core TypeScript player
│   └── embed-sdk/
│       └── dist/
│           ├── lumo.min.js         # Production embed bundle (synced with db-player.js)
│           └── lumo.esm.js         # Production ESM bundle
├── samples/
│   ├── career-gateway.html         # Accessible job card with "Listen to Summary"
│   ├── certificate.html            # Employer Open Badges 3.0 verification page
│   ├── test-harness.html           # Accessibility gate test harness
│   ├── captions-am.vtt             # Genuine Amharic Fidel caption track
│   └── captions-en.vtt             # Genuine English caption track
├── savanna/
│   ├── assets/css/
│   │   └── application_alx.css     # Host Savanna Bootstrap styles (1.5 MB unpolluted)
│   └── pages/
│       ├── concept-with-navigation.html # Savanna lesson page with <db-player> mounted
│       ├── test-lesson.mp4         # Real video asset
│       ├── lesson.ethsl.mp4        # Real sign language asset
│       ├── lesson.ad.mp3           # Real audio description asset
│       ├── lesson.am.vtt           # Amharic VTT
│       └── lesson.en.vtt           # English VTT
├── services/api/
│   ├── app/core/security.py        # Constant-time tenant API key verification
│   ├── app/core/config.py          # Provisioned tenant registry
│   ├── app/services/zip_builder.py # HTML-escaped secure offline bundle generator
│   └── tests/test_api.py           # API & security unit tests
├── index.html                      # Flagship showcase app & interactive studio
├── vercel.json                     # Vercel service configuration
└── PROJECT_SUMMARY.md              # Complete architecture & deliverables documentation
```

---

## 3. Core Component Usage

```html
<!-- 1. Include the single script tag -->
<script src="module/db-player.js" defer></script>

<!-- 2. Mount the custom component -->
<db-player
  src="test-lesson.mp4"
  captions="lesson.en.vtt,lesson.am.vtt"
  sign="lesson.ethsl.mp4"
  describe="lesson.ad.mp3"
  lang="am">
</db-player>
```

---

## 4. Key Verification URLs (Port 8000)

| Endpoint | Description |
| :--- | :--- |
| `http://localhost:8000/` | Interactive Showcase & Live Player Studio |
| `http://localhost:8000/savanna/pages/concept-with-navigation.html` | ALX Savanna Drop-in Integration (Real Media) |
| `http://localhost:8000/samples/test-harness.html` | Accessibility Gate Test Harness |
| `http://localhost:8000/samples/career-gateway.html` | Accessible Job Card with Audio Summary |
| `http://localhost:8000/samples/certificate.html` | Employer Open Badges 3.0 Verification |
| `http://localhost:8000/demo/blank.html` | Zero-CSS Bleed Proof Page (Real Media) |
