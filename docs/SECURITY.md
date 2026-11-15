# Lumo API Security & Hardening Report

This report outlines the security posture, authentication architecture, and hardening measures implemented across the Lumo backend services (`services/api`).

## 1. Authentication & Key Verification
* **Vulnerability Remediated:** Previously, keys starting with the `lumo_` prefix bypassed authorization checks.
* **Current Implementation (`services/api/app/core/security.py`):**
  * All protected endpoints require the `X-Lumo-Key` request header.
  * Validation uses constant-time string comparison (`secrets.compare_digest`) against explicitly provisioned tenant keys (`settings.PROVISIONED_API_KEYS`).
  * Timing attack surface is eliminated.
  * Arbitrary prefix matching is rejected with HTTP `401 Unauthorized` and `INVALID_API_KEY` code.

## 2. Sliding Window Rate Limiting (`services/api/app/core/rate_limit.py`)
* Sensitive endpoints (`/v1/captions/generate`, `/v1/packages/generate`, `/v1/lessons/{id}/ask`) are protected with sliding-window rate limiting.
* Rate limits are enforced on a per-client basis (keyed by `X-Lumo-Key` or client IP address).
* Clients exceeding the quota receive HTTP `429 Too Many Requests` with a standard `Retry-After` header and structured error payload (`RATE_LIMIT_EXCEEDED`).

## 3. Document Remediation & HTML Sanitization
* User-provided and remediated HTML is processed through `HTMLSanitizer` (`packages/document-processor/src/HTMLSanitizer.ts`).
* Strictly removes:
  * `<script>`, `<iframe>`, `<object>`, `<applet>`, `<embed>`, `<base>`, `<meta http-equiv>` tags.
  * Inline DOM event listeners (`onclick`, `onerror`, `onload`, `onmouseover`, etc.).
  * Pseudo-protocols in attributes (`javascript:`, `vbscript:`, `data:text/html`).
  * Dangerous CSS expressions (`expression(...)`, `behavior`, `javascript:`).

## 4. Packaging Security (`services/api/app/services/zip_builder.py`)
* Dynamic package generation escapes user-supplied lesson titles and metadata using `html.escape` to prevent Cross-Site Scripting (XSS) within offline bundles.
* ZIP construction validates paths to prevent Directory Traversal / Zip Slip attacks.
