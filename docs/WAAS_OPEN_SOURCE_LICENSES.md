# Open Source Attribution and Dependency Notices

**Lumo WaaS Plugin & Credential Component Integration**  
*ALX Ethiopia Digital Bridge Hackathon 2026*

---

## 1. Upstream Components and Attribution

### Digital Credentials Consortium (DCC) Issuer-Coordinator
- **Repository**: `digitalcredentials/issuer-coordinator`
- **Origin**: Digital Credentials Consortium
- **License**: MIT License
- **Role in Lumo**: Provides VC-API specification patterns and coordinate endpoints for verifiable credential issuance and lifecycle status tracking.
- **Integration Boundary**: Isolated behind `IssuerCoordinatorAdapter` (`api/services/issuer-coordinator-adapter.js`). It is accessed via internal container networking without leaking internal administrative interfaces to public clients.

### 1EdTech Open Badges 3.0 / W3C Verifiable Credentials Data Model
- **Standards**: W3C Verifiable Credentials Data Model v2.0, 1EdTech Open Badges 3.0 Context
- **Role in Lumo**: JSON-LD context and credential schema standards used for tamper-evident digital representations of guarantor endorsements and learning certificates.

---

## 2. Core Dependencies & License Manifest

| Component / Library | Upstream License | Intended Usage |
| :--- | :--- | :--- |
| `express` | MIT License | Lightweight HTTP service routing |
| `helmet` | MIT License | HTTP security headers and CSP boundaries |
| `cors` | MIT License | Cross-Origin Resource Sharing control |
| `express-rate-limit` | MIT License | Sliding-window request rate limiting |
| `uuid` | MIT License | CSPRNG unique identifier generation |
| `qrcode` | MIT License | High-contrast visual credential verification QR codes |
| `fastapi` | MIT License | Python API routing and OpenAPI contract schemas |
| `pytest` | MIT License | Automated unit and integration testing harness |
| `pa11y` | LGPL-3.0 | WCAG 2.2 AA accessibility regression verification |

---

## 3. Ethical and Human Rights Principles

1. **Non-Exclusionary Access**: Software incorporating these components must not require national identity cards (e.g., Kebele or Fayda ID) as a mandatory prerequisite for educational verification or personal guarantees.
2. **Prohibition of Human Ranking**: Components may not be configured to generate numeric behavioral scores, social ratings, or automatic exclusion algorithms targeting vulnerable or displaced individuals.
3. **Data Minimization**: Public verification services must only display claims confirmed with explicit user consent, excluding phone numbers, biometric records, and confidential identity documents.
