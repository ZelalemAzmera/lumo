# Hackathon Judges' 45-Minute Walkthrough Challenge ⏱️

> **Digital Bridge Accessibility Hackathon 2026 — Track 2: Accessible Learning Media**  
> Complete evaluation guide designed to allow judges and technical reviewers to verify all project claims and deliverables within 45 minutes.

---

## 🧭 Evaluation Schedule & Checklist

| Time Elapsed | Target Activity | Expected Outcome |
| :---: | :--- | :--- |
| **00:00 – 00:08** | Automated Accessibility Verification | Zero WCAG 2.2 AA violations in `@axe-core/playwright` CI gate |
| **00:08 – 00:20** | `<lumo-player>` Component & Keyboard Operability | English/Amharic captions, ESL PIP window, Audio Description |
| **00:20 – 00:30** | ALX Savanna Drop-in Demonstration | 1-line HTML embed, zero stylesheet leakage, Shadow DOM |
| **00:30 – 00:38** | Offline Package (< 10 MB) & Service Worker | Generates standalone offline HTML player operable with zero network |
| **00:38 – 00:45** | Telegram Bot & REST API Verification | Low-bandwidth text transcripts, AI tutor with citations, OpenAPI |

---

## Stage 1: Automated Accessibility Verification (Minutes 0–8)

Lumo enforces a **zero-tolerance accessibility gate** for all critical, serious, and moderate WCAG 2.2 Level AA violations.

### Execute the Gate:
```bash
# In the project root:
pnpm test:a11y
```

### What to Look For:
- Playwright launches Google Chrome and runs axe-core against 4 critical states:
  1. Default player initial state.
  2. Captions active with high-contrast text rendering.
  3. Ethiopian Sign Language PIP window active.
  4. Keyboard shortcuts dialog open.
- Terminal output confirms: **`4 passed (100% clean, 0 violations)`**.

---

## Stage 2: `<lumo-player>` Hands-On Evaluation (Minutes 8–20)

### Launch Local Server:
```bash
python -m http.server 8080
```
Open **[http://localhost:8080/samples/test-harness.html](http://localhost:8080/samples/test-harness.html)** in Google Chrome.

### Test Criteria:
1. **Screen Reader Live Announcements**:
   - Turn on **NVDA** (Windows: `Ctrl + Alt + N`) or inspect the DOM's `#lumo-announcer` (`aria-live="polite"`).
   - Press `Space` to Play/Pause -> verify announcer speaks "Playing" and "Paused".
2. **Keyboard Operability (WCAG 2.1.1)**:
   - Press `Tab` to navigate through controls. Confirm a bright yellow 3px focus ring is clearly visible on every button.
   - Press `?` to open the Keyboard Help Dialog. Verify focus is trapped inside the dialog.
   - Press `Escape` to close the dialog; verify focus returns to the Help button.
3. **Amharic Fidel Captions**:
   - Press `C` twice to switch to Amharic captions (`ፊደል`).
   - Notice the typography rendered via **Noto Sans Ethiopic**, crisp diacritic marks, and strictly enforced LTR flow.
4. **Ethiopian Sign Language (ESL) PIP Window**:
   - Press `S` to toggle the Sign Language overlay.
   - Use the mouse or arrow keys to drag the window or snap it to any corner.
   - Play/pause the master video — observe the ESL video stays 100% time-synchronized.
5. **Audio Description (AD)**:
   - Press `D` to toggle Audio Description. Notice seamless video track swap without position loss.

---

## Stage 3: ALX Savanna Platform Embed Verification (Minutes 20–30)

Open **[http://localhost:8080/samples/savanna-demo.html](http://localhost:8080/samples/savanna-demo.html)**.

### Evaluation Points:
1. Scroll down to the **Before** section (standard HTML5 video player). Note the total absence of captions, sign language, and screen reader accommodations.
2. Scroll to the **After** section (Lumo integration). Note how `<lumo-player>` drops directly into the existing Savanna layout.
3. Inspect element with Chrome DevTools:
   - Notice the `#shadow-root (open)`.
   - Observe that Savanna's dark theme and Tailwind classes do not corrupt the player's internal high-contrast buttons or caption positioning.

---

## Stage 4: Offline Package & Low-Bandwidth Mode (Minutes 30–38)

Verify the **sub-10MB offline learning bundle**:

```bash
# In another terminal:
cd services/api
python -m uvicorn app.main:app --port 8000
```

1. Generate an offline bundle via curl:
```bash
curl -X POST http://localhost:8000/api/v1/packages/generate \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"lesson_id": "test-lesson", "title": "Accessible Web Architecture"}'
```
2. Note the returned `package_id`. Download the resulting zip:
```bash
curl -X GET http://localhost:8000/api/v1/packages/<PACKAGE_ID>/download \
  -H "X-Lumo-Key: lumo_dev_key_2026" \
  --output test-lesson.zip
```
3. Extract `test-lesson.zip`. Open `index.html` directly from disk (`file:///...`).
4. Disconnect your internet connection (or turn on Airplane Mode).
5. Verify the lesson plays, styles render, and captions display with zero network activity!

---

## Stage 5: Telegram Accessibility Gateway & API (Minutes 38–45)

1. **Run Backend & Telegram Bot Test Suite**:
```bash
python -m pytest services/api/tests apps/telegram-bot/tests
```
Confirm all 14 tests pass.

2. **Inspect Interactive OpenAPI 3.1.0 Docs**:
Navigate to **[http://localhost:8000/docs](http://localhost:8000/docs)** to review the interactive Swagger UI and test endpoints directly.

3. **Verify Career Gateway**:
Open **[http://localhost:8080/samples/career-gateway.html](http://localhost:8080/samples/career-gateway.html)**.
- Zoom the browser to **200%** (`Ctrl + Plus`).
- Confirm zero horizontal scrolling and zero content clipping (WCAG 1.4.4 & 1.4.10).
- Click "Listen to Job Overview" to hear client-side speech synthesis of the role and accommodations.

---

## 🏆 Scoring Summary for Judges

| Hackathon Criterion | Lumo Implementation Proof |
| :--- | :--- |
| **Accessibility Excellence** | Full WCAG 2.2 AA compliance; 0 axe-core violations; dual Amharic/English captions; ESL PIP; Audio Description. |
| **System Extensibility** | 1-line Web Component embed; Shadow DOM encapsulation; fits any LMS without codebase rewrites. |
| **Offline & Low Connectivity** | Sub-10MB offline zip generator; Service Worker PWA; Telegram bot text transcripts (< 10 KB). |
| **Production Engineering** | Complete TypeScript/Python monorepo; Docker Compose; OpenAPI 3.1.0; 35 automated tests. |
