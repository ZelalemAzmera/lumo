# Lumo (ሉሞ) — Track 2 Project Summary & Architecture

**Digital Bridge Accessibility Hackathon 2026 — Track 2: Accessible Learning Media**  
**Repository:** [https://github.com/ZelalemAzmera/lumo.git](https://github.com/ZelalemAzmera/lumo.git)  
**Branch:** `feat/track2-db-player-data-contract`  
**Status:** All requirements implemented, verified, and pushed to origin.

---

## 1. What Has Been Done

### A. Data Contract & Attribute Alignment
Standardized `<db-player>` Web Component attributes to match the exact evaluation specification:
* `src`: Primary MP4 video source (`lesson.mp4`).
* `captions`: Comma-separated WebVTT tracks (`lesson.en.vtt,lesson.am.vtt`).
* `sign`: Ethiopian Sign Language (EthSL) picture-in-picture video (`lesson.ethsl.mp4`).
* `describe`: Synchronized audio description MP3 track (`lesson.ad.mp3`).
* `lang`: UI language switch (`am` or `en`).

### B. Required Buttons Implemented
1. **Keyboard Help (`#btn-help`)**: Dedicated toolbar button triggering `<dialog id="help-dialog">` with all WCAG single-key navigation shortcuts.
2. **Download Transcript as Text (`#btn-dl-text`)**: Export button inside the transcript panel that downloads the full lesson transcript as a `.txt` file.
3. **Offline Download with Size Warning (`#btn-offline`)**: Control toolbar button explicitly labeled `"Download for offline (4.2 MB)"` per the hackathon offline requirement.

### C. Career Gateway & Open Badges 3.0 Verification
* **Audio Summary (`#btn-speak-summary`)**: "Listen to Summary" button utilizing Web Speech API (`SpeechSynthesis`) on the job card.
* **Employer Certificate Page ([samples/certificate.html](file:///c:/hackathon/track%202%20alx/samples/certificate.html))**: Cryptographically structured credential with W3C Open Badges 3.0 / Schema.org JSON-LD metadata for employer validation.
* **Host Integration ([savanna/pages/concept-with-navigation.html](file:///c:/hackathon/track%202%20alx/savanna/pages/concept-with-navigation.html))**: Single script tag embed placed directly under the curriculum banner with zero CSS bleed.

### D. UI/UX Overhaul ("Midnight & Jade")
* **Strict 4-Color Palette**: Deep Navy (`#172B3A`), Jade Green (`#20A486`), Mist Grey (`#E8EFF2`), Soft Ivory (`#FAFAF7`).
* **Swiss Editorial Typography**: Headings in `Manrope`, body text in `Inter`, Ge'ez in `Noto Sans Ethiopic`.
* **WCAG 2.2 Level AA Hardened**: 3px visible focus rings, 44px touch targets, 0 axe-core violations, 8px layout rhythm.

### E. Vercel Deployment Configuration
* Added `vercel.json` declaring `services.web` with static root rewrites, resolving the `[MISSING_SERVICES]` deployment error.

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
│   └── blank.html                  # Standalone raw HTML proof (zero host stylesheet pollution)
├── module/
│   └── db-player.js                # Core Web Component (<db-player> & <lumo-player>)
├── packages/
│   └── embed-sdk/
│       └── dist/
│           └── lumo.min.js         # Production embed bundle (synced with db-player.js)
├── samples/
│   ├── career-gateway.html         # Accessible job card with "Listen to Summary"
│   ├── certificate.html            # Employer Open Badges 3.0 verification page
│   ├── captions-am.vtt             # Sample Amharic Fidel caption track
│   └── captions-en.vtt             # Sample English caption track
├── savanna/
│   ├── assets/css/
│   │   └── application_alx.css     # Host Savanna Bootstrap styles (1.5 MB unpolluted)
│   └── pages/
│       └── concept-with-navigation.html # Savanna lesson page with <db-player> mounted
├── index.html                      # Flagship showcase app & interactive studio
├── vercel.json                     # Vercel service configuration
└── PROJECT_SUMMARY.md              # This concise architecture summary
```

---

## 3. Core Component Usage

```html
<!-- 1. Include the single script tag -->
<script src="module/db-player.js" defer></script>

<!-- 2. Mount the custom component -->
<db-player
  src="lesson.mp4"
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
| `http://localhost:8000/samples/career-gateway.html` | Accessible Job Card with Audio Summary |
| `http://localhost:8000/samples/certificate.html` | Employer Open Badges 3.0 Verification |
| `http://localhost:8000/savanna/pages/concept-with-navigation.html` | ALX Savanna Drop-in Integration |
| `http://localhost:8000/demo/blank.html` | Zero-CSS Bleed Proof Page |
