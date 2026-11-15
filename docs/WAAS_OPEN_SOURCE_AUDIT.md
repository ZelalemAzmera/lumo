# Open-Source Audit & Evaluation for Lumo WaaS Plugin
**Document ID:** `docs/WAAS_OPEN_SOURCE_AUDIT.md`  
**Purpose:** Technical and architectural evaluation of open-source libraries for the Lumo WaaS (Guarantor & Verification as a Service) infrastructure.

---

## 1. Candidate Evaluation Matrix

| Library / System | Upstream Repository | Licence | Maintenance & Health | Solves Lumo Requirement? | Existing Lumo Equivalent? | Verdict | Decision Rationale |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Open Badges 3.0 (1EdTech)** | [1EdTech/openbadges-specification](https://github.com/1EdTech/openbadges-specification) | CC BY-SA 4.0 | Highly active, official W3C VC aligned | Yes (Verifiable credentials for course and guarantor references) | Custom schemas | **SELECTED (Schema Pattern)** | Adopt Open Badges 3.0 JSON-LD schema for issued guarantor credentials (`@context`, `type: ['VerifiableCredential', 'OpenBadgeCredential', 'WaaSCredential']`). Provides global interoperability without vendor lock-in. |
| **Keycloak** | [keycloak/keycloak](https://github.com/keycloak/keycloak) | Apache-2.0 | Very active (Red Hat / CNCF) | Heavyweight IAM for enterprise SSO | FastAPI token / constant-time key validation | **REJECTED** | High operational footprint (requires JVM, standalone relational DB, 1GB+ RAM), contrary to Lumo's lightweight, low-resource deployment in Ethiopian education environments. |
| **OpenID4VCI / OpenID4VP** | [openid/OpenID4VCI](https://github.com/openid/OpenID4VCI) | Apache-2.0 | Active W3C/OpenID Foundation standard | Protocol for wallet-based credential issuance & presentation | Lightweight REST verification | **EVALUATED (Future Wallet Phase)** | Aligned architectural blueprint; full protocol stack adds unnecessary complexity for MVP hackathon scope. REST-based verification with public WaaS IDs achieves the same privacy and verification goals. |
| **Open Policy Agent (OPA)** | [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | Apache-2.0 | Very active (CNCF Graduated) | Policy-based fine-grained authorization | Python/JS inline RBAC | **REJECTED** | Running a separate daemon/sidecar for Rego policies introduces unnecessary latency and complexity for Lumo's straightforward role hierarchy (Applicant, Guarantor, Admin, Verifier). |
| **Pydantic (Backend) / Zod (Frontend)** | [pydantic/pydantic](https://github.com/pydantic/pydantic) & [colinhacks/zod](https://github.com/colinhacks/zod) | MIT | Very active | Strict request validation & schema definition | Pydantic v2 already in `services/api` | **SELECTED** | Pydantic v2 is already the core validation layer in Lumo backend (`services/api`). Reused directly for all WaaS request, consent, and verification models. |
| **Helmet** | [helmetjs/helmet](https://github.com/helmetjs/helmet) | MIT | Very active | Security HTTP headers (CSP, HSTS, X-Frame-Options) | Starlette / FastAPI middleware | **SELECTED** | Applied to Node Express service (`api/`) and equivalent security headers applied in FastAPI middleware (`services/api`). |
| **axe-core** | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | MPL-2.0 | Industry standard | Automated accessibility auditing (WCAG 2.2 AA) | Already configured in `tests/e2e` | **SELECTED** | Automated accessibility auditing for `<db-waas>` across Shadow DOM boundaries in Playwright E2E suite. |
| **qrcode** | [soldair/node-qrcode](https://github.com/soldair/node-qrcode) | MIT | Active, zero native build requirements | QR code generation for mobile verification links | None | **SELECTED** | Generates SVG and DataURL QR codes for issued credentials, allowing instant third-party phone scanning. |

---

## 2. Integration Guidelines & Architecture Policy
1. **Zero Native C++ Dependencies:** Avoid binary modules that fail compilation on minimal Linux containers or Windows dev environments without Visual Studio C++ toolchains.
2. **Data Minimization:** No personal phone numbers, identity document uploads, or biometric records are ever exposed in public verification endpoints.
3. **No Centralized Surveillance / Social Credit:** Rejection of arbitrary "trust scores" (0–100) or algorithmic ranking of human applicants. Decisions are human-driven, explainable, and consent-based.
4. **Offline & Low-Bandwidth Resilience:** Lightweight payload sizes (< 50KB for `<db-waas>` bundle), compatible with 2G/3G connections and Ethio Telecom mobile networks.
