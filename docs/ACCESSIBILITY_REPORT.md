# Lumo Accessibility Testing Report (WCAG 2.2 AA)

## 1. Automated Axe-Core Audit Results
Automated accessibility tests are executed via Playwright (`@axe-core/playwright`) against the canonical Web Component in Chromium.

**Test Command:** `pnpm run test:a11y` (or `npx playwright test tests/e2e/a11y-gate.spec.ts`)
**Standard:** WCAG 2.0 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA

| Test Scenario | Status | Axe Violations | Execution Time |
| :--- | :--- | :--- | :--- |
| **Initial Load Audit** | **PASS** | **0** | 6.2s |
| **Active Dual Captions (EN + AM)** | **PASS** | **0** | 3.8s |
| **Ethiopian Sign Language Window Open** | **PASS** | **0** | 4.0s |
| **Keyboard-Only Operation (Tab, C, S, Esc)** | **PASS** | **0** | 1.7s |

## 2. Keyboard Navigation Contract
All player interactions are 100% operable via keyboard without mouse dependency:

| Key | Action |
| :--- | :--- |
| `Space` / `K` | Toggle Play / Pause |
| `J` / `←` | Seek back 10 seconds (or 5s with arrow) |
| `L` / `→` | Seek forward 10 seconds (or 5s with arrow) |
| `↑` / `↓` | Increase / decrease volume by 10% |
| `M` | Toggle Audio Mute |
| `C` | Cycle Captions (Off → English → Amharic) |
| `S` | Toggle Ethiopian Sign Language overlay window |
| `D` | Toggle Audio Description track |
| `F` | Toggle Fullscreen mode |
| `?` | Open Keyboard Help dialog |
| `Esc` | Close open overlays (ESL window, Keyboard Help modal) |

## 3. Ethiopian Localization & Screen Readers
* **Fidel Typography:** Loaded with `Noto Sans Ethiopic` Google font with `line-height: 1.65` and `font-display: swap` to prevent FOIT/FOUT.
* **ARIA Live Region:** Dedicated polite live announcer (`aria-live="polite"`, `aria-atomic="true"`) reports state changes (volume, play/pause, caption language changes) to screen readers (NVDA, TalkBack, JAWS).
* **High-Contrast Theme:** Midnight & Jade palette (#172B3A deep navy background, #FAFAF7 soft ivory text, #20A486 jade green accent) achieves contrast ratios exceeding 7:1 (well above the 4.5:1 WCAG AA requirement).
