# Digital WaaS (ዋስ) — Integration & Deployment Guide

**Web Component Embedding, Telegram Gateway & Platform Integration**  
*ALX Ethiopia Digital Bridge Hackathon 2026*

---

## 1. Web Component Integration (`<db-waas>`)

The primary frontend interface of WaaS is a zero-dependency, open Shadow DOM Web Component defined in `module/db-waas.js`.

### 1.1 Quick Start (Blank HTML or LMS Embedding)
Add two lines to your HTML document:

```html
<!-- 1. Import WaaS Component -->
<script type="module" src="/module/db-waas.js"></script>

<!-- 2. Declare Component Instance -->
<db-waas
  api="http://localhost:3001"
  mode="applicant"
  lang="en"
  theme="light">
</db-waas>
```

### 1.2 Observed Attributes
| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `api` | `string` | `""` | Base URL of the WaaS API service (`http://localhost:3001` or `http://localhost:8000`). |
| `mode` | `string` | `"applicant"` | Operating view: `"applicant"` (5-step request wizard), `"guarantor"` (review dashboard), `"employer"` (credential verification), or `"institutional"` (partner onboarding). |
| `lang` | `string` | `"en"` | Localization language: `"en"` (English) or `"am"` (Amharic Ethiopic Fidel ፊደል). |
| `theme` | `string` | `"light"` | Visual theme: `"light"` (Midnight & Jade Soft Ivory background) or `"dark"` (Deep Navy surface). |

---

## 2. Event Contract & Custom Events

The component dispatches DOM Custom Events with `bubbles: true` and `composed: true`, allowing host applications to listen across the Shadow DOM boundary:

```javascript
const waasElement = document.querySelector('db-waas');

// 1. Applicant completes guarantee request submission
waasElement.addEventListener('db-waas:request-created', (event) => {
  const { requestId, applicantId, purpose } = event.detail;
  console.log(`[Host App] Guarantee request ${requestId} created for ${applicantId}`);
});

// 2. Credential successfully issued by guarantor
waasElement.addEventListener('db-waas:credential-issued', (event) => {
  const { waasId, credential, qrCodeDataUrl } = event.detail;
  console.log(`[Host App] Open Badges 3.0 issued: ${waasId}`);
});

// 3. Verification check completed
waasElement.addEventListener('db-waas:verification-completed', (event) => {
  const { waasId, status, isValid } = event.detail;
  console.log(`[Host App] Verification result for ${waasId}: ${status} (Valid: ${isValid})`);
});

// 4. Component error handling
waasElement.addEventListener('db-waas:error', (event) => {
  const { code, message } = event.detail;
  console.error(`[Host App] WaaS Error [${code}]: ${message}`);
});
```

---

## 3. Co-Existence with Track 2 Player (`<db-player>`)

`<db-waas>` and `<db-player>` were co-designed to live on the same page with **zero conflicts**:

1. **Shadow DOM Encapsulation**: Both components use separate Shadow Roots. Internal stylesheets, CSS variables, and ID selectors never collide.
2. **Unified Four-Color Design System**:
   - Primary: Deep Navy (`#172B3A`)
   - Accent: Jade Green (`#20A486`)
   - Secondary: Mist Grey (`#E8EFF2`)
   - Neutral: Soft Ivory (`#FAFAF7`)
3. **Keyboard Focus Management**: Neither component traps focus. Tab indexing cycles smoothly from video player controls to WaaS form inputs.

See live working implementation in [`samples/waas-demo.html`](file:///c:/hackathon/track%202%20alx/samples/waas-demo.html).

---

## 4. Track 3 Telegram Bot Gateway Integration

For students and displaced learners in remote or low-bandwidth environments, WaaS features are accessible via Telegram:

### Available Commands
- `/waas`: Summarizes the WaaS guarantor program and lists accredited institutional partners (e.g. ALX Ethiopia Education Partner).
- `/verify <waas_id>`: Verifies any Open Badges 3.0 WaaS credential directly inside Telegram, returning cryptographic validity, recipient name, issuer, purpose, and expiration date without leaking personal identity documents.

### Architecture Connection
The Telegram bot interacts with the shared FastAPI service (`services/api/app/api/v1/waas.py`) via `LumoAPIClient` (`apps/telegram-bot/bot/api_client.py`), querying the exact same persistent SQLite database (`api/database/waas.db`).
