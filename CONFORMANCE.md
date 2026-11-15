# Conformance Report: Lumo (CONFORMANCE.md)

> **Digital Bridge Accessibility Hackathon 2026 — Track 2: Accessible Learning Media**  
> Evaluated against: **W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**  
> Method: Automated CI (`@axe-core/playwright` on Chromium), Vitest unit test suite, Pytest API tests, and manual keyboard audits.

---

## 📊 Summary of Conformance & Automated Evidence

| WCAG 2.2 AA Criterion | Status | Technical Implementation & Verification Evidence |
| :--- | :---: | :--- |
| **1.1.1 Non-text content** | **Pass** | All media controls provide programmatic `aria-label` matching visible indicators (`Play`, `Pause`, `Back 10s`, `Captions`, `Sign Language`, `Transcript`, `Full Screen`, `Keyboard Help`). Verified via Playwright axe-core audit. |
| **1.2.2 Captions (prerecorded)** | **Pass** | Dual English and Amharic Fidel (`ፊደል`) captions rendered via WebVTT with `Noto Sans Ethiopic` typography (`line-height: 1.65`). Automated test verifies zero violations with active captions. |
| **1.2.5 Audio description (prerecorded)** | **Pass** | Secondary synchronized audio description track (`<audio id="ad-audio">`) with < 35ms continuous drift correction. Verified via unit and browser tests. |
| **1.3.1 Info and relationships** | **Pass** | Semantic HTML5 throughout (`<button>`, `<dialog>`, `<toolbar>`, `<table>`, `<th>`). Shadow DOM isolates styles from host pages. |
| **1.4.3 Contrast (minimum)** | **Pass** | High-contrast Midnight & Jade brand palette achieves > 7:1 contrast on all standard surfaces. High-contrast theme delivers 16.8:1. |
| **1.4.10 Reflow** | **Pass** | Responsive layout tested down to 320px viewport and 200% browser zoom with zero horizontal scrolling. |
| **1.4.11 Non-text contrast** | **Pass** | 3px high-contrast focus rings (`#20A486` / `#f5a300`) maintain > 3:1 contrast against adjacent elements. |
| **1.4.12 Text spacing** | **Pass** | Ethiopic Fidel text uses `line-height: 1.65` and `font-display: swap` to prevent glyph clipping. |
| **2.1.1 Keyboard** | **Pass** | 100% operable via keyboard without mouse. Standard shortcuts: `Space`/`K` (Play/Pause), `J`/`←` (Back 10s), `L`/`→` (Forward 10s), `C` (Captions), `S` (Sign Language), `D` (AD), `M` (Mute), `?` (Help dialog). Verified via Playwright. |
| **2.1.2 No keyboard trap** | **Pass** | All dialogs and overlays close with `Escape`, restoring focus to the triggering control. |
| **2.4.7 Focus visible** | **Pass** | Persistent 3px focus ring with 2px offset; never suppressed by `outline: none`. |
| **2.5.3 Label in name** | **Pass** | Programmatic `aria-label` matches visible control text in both English and Amharic locales. |
| **2.5.7 Dragging movements** | **Pass** | Ethiopian Sign Language overlay supports both dragging AND single-pointer corner snap buttons (Top-Left, Top-Right, Bottom-Left, Bottom-Right, Larger, Smaller). Dragging alone is never required. |
| **2.5.8 Target size (minimum)** | **Pass** | All interactive controls satisfy the minimum 44×44 CSS pixel touch target boundary. |
| **3.1.2 Language of parts** | **Pass** | Amharic content explicitly tagged with `lang="am"` so assistive technologies select Ethiopic voices. |
| **4.1.2 Name, role, value** | **Pass** | Standard WAI-ARIA roles (`role="region"`, `role="toolbar"`, `role="dialog"`, `aria-pressed`, `aria-valuenow`). |
| **4.1.3 Status messages** | **Pass** | Polite ARIA live region (`aria-live="polite"`, `aria-atomic="true"`) announces volume, playback, and language changes. |

---

## 🧪 Automated Testing Verification Record

All automated test suites are executed in local and CI environments:

1. **Vitest Unit Test Suite (`pnpm test`):**
   - 6 test files, 20 tests total: **20 Passed (100%)**
   - Covers VTT parsing, time formatting, state transitions, offline package handling, document tag checking, HTML sanitization, and website resource discovery.
2. **Pytest Backend API & Bot Suite (`pnpm test:python`):**
   - 2 test files, 17 tests total: **17 Passed (100%)**
   - Covers API health, constant-time key authentication, rejection of arbitrary key prefixes, rate limiting (HTTP 429), caption generation, package generation and ZIP download, document remediation, and Telegram bot handlers.
3. **Playwright E2E WCAG 2.2 AA Accessibility Gate (`pnpm test:a11y`):**
   - 4 tests total: **4 Passed (100%)**
   - Zero violations on initial load.
   - Zero violations with active captions.
   - Zero violations with Ethiopian Sign Language window active.
   - Verified 100% keyboard shortcut operability.

---

## ⚠️ Honest Limitations & External Dependencies

1. **Ethiopian Sign Language Content Availability:** While the technical synchronization interface (`VideoSync.ts`), PIP window, resize/drag controls, and `< 35ms` sync threshold are fully implemented and tested with sample video media, full curricula of professional Ethiopian Sign Language video recordings require certified native EthSL interpreters.
2. **Budget Android Device Speech Synthesis:** Certain ultra-low-cost Android devices lack pre-installed Amharic speech engines (`am-ET`); for these environments, Lumo provides synchronized audio description audio files and downloadable text transcripts.
3. **Automated Amharic ASR Vocabulary:** Open Whisper ASR models produce vocabulary errors on localized Ethiopian technical terminology; the Lumo Caption Studio interface is provided for educator post-editing before publishing.
