# Digital WaaS (ዋስ) — System Architecture

**Refugee Guarantor & Institutional Verification Infrastructure with DCC Issuer Coordinator Integration**  
*ALX Ethiopia Digital Bridge Hackathon 2026*

---

## 1. System Overview & Core Philosophy

**Digital WaaS (ዋስ - Ethiopian legal and customary institution of personal guarantee)** is an embeddable trust, consent, and verification infrastructure designed for displaced persons, refugees, and students who lack traditional collateral, formal banking histories, or national identity documents (Fayda / Kebele IDs).

### Core Ethical & Architectural Boundaries
1. **Zero Exclusion**: Human beings are **never excluded** because they lack a Kebele ID or Fayda ID. The system supports UNHCR refugee registration certificates, trusted partner referrals, and human-in-the-loop manual verification.
2. **No Numeric Human Scoring**: The system **never ranks or scores human beings** with arbitrary numbers (0–100) or describes individuals as "untrustworthy". Matchmaking is strictly categorical, rule-based, and explainable.
3. **Data Minimization & Zero Leaks**: Public verification endpoints verify validity and identity claims **without ever exposing** private phone numbers, national identification numbers, or raw identity documents.
4. **Decentralized & Interoperable**: Issued credentials adhere to the **W3C Verifiable Credentials Data Model v2.0** and **1EdTech Open Badges 3.0** standard with cryptographic digital signatures orchestrated via the Digital Credentials Consortium (DCC) VC-API architecture.
5. **Universal Integration**: Integrates directly with Lumo Track 2 (`<db-player>` Web Component) and Track 3 (Accessible Telegram Gateway) without backend duplication.

---

## 2. System Architecture Topology

The target architecture isolates the external credential issuance and status coordination components behind an adapter while keeping Lumo's existing SQLite backend and REST API as the authoritative system of record.

```mermaid
flowchart TD
    subgraph UI_Layer ["Front-End Embeddable Layer (Shadow DOM / Web Components)"]
        A["<db-player> (Track 2 Playback Engine)"]
        B["<db-waas> (WaaS Plugin Component)"]
        B1["1. Applicant Request Wizard"]
        B2["2. Guarantor Consent & Review Interface"]
        B3["3. Public Verification Portal"]
        B --- B1
        B --- B2
        B --- B3
    end

    subgraph Multi_Channel ["Multi-Channel Gateways"]
        TG["Track 3: Accessible Telegram Bot (/waas, /verify)"]
        CAREER["Lumo Career Gateway & Certificate Portal"]
    end

    subgraph API_Gateway ["Lumo Application Backend"]
        REST["Lumo WaaS Express REST API (:3001)"]
        FAST["Lumo FastAPI Engine (:8000)"]
    end

    subgraph Core_Services ["Lumo Domain Services"]
        CONSENT["ConsentService (Single-Use Hashed Tokens)"]
        MATCH["MatchingService (Categorical & Explainable)"]
        IDENT["IdentityService (Non-Exclusionary Ingestion)"]
        ADAPTER["IssuerCoordinatorAdapter (Circuit Breaker & VC-API)"]
    end

    subgraph Coordinator_Boundary ["Isolated DCC Credential Service Boundary"]
        DCC["DCC Issuer-Coordinator (:4005)"]
        DCC_SIGN["Isolated Signing Service (VC-API /credentials/issue)"]
        DCC_STATUS["Isolated Status Service (VC-API /credentials/status)"]
        LOCAL_ENG["Local Cryptographic Fallback Engine (HMAC-SHA256)"]
    end

    subgraph Persistence ["Persistence Layer"]
        DB[("SQLite Embedded Database (waas.db)")]
        AUDIT[("Immutable Audit Trail (audit_log)")]
    end

    UI_Layer --> REST
    Multi_Channel --> FAST
    FAST -.-> DB
    REST --> CONSENT
    REST --> MATCH
    REST --> IDENT
    REST --> ADAPTER
    CONSENT --> ADAPTER
    ADAPTER --> DCC
    DCC --> DCC_SIGN
    DCC --> DCC_STATUS
    ADAPTER -. Circuit Breaker Fallback .-> LOCAL_ENG
    CONSENT --> DB
    MATCH --> DB
    IDENT --> DB
    ADAPTER --> DB
    REST --> AUDIT
```

---

## 3. Single-Use Consent & Issuance Sequence

The consent lifecycle guarantees that credentials cannot be issued prematurely or without unforgeable guarantor consent.

```mermaid
sequenceDiagram
    autonumber
    actor Applicant
    actor Guarantor
    participant Component as <db-waas> Web Component
    participant API as Lumo WaaS API (:3001)
    participant Consent as ConsentService
    participant Adapter as IssuerCoordinatorAdapter
    participant DCC as DCC Issuer Coordinator (:4005)
    participant DB as SQLite (waas.db)

    Applicant->>Component: Fills Guarantee Request (e.g. scholarship)
    Component->>API: POST /api/waas/requests
    API->>Consent: createConsentToken(requestId, guarantorId)
    Consent->>Consent: CSPRNG 256-bit token + SHA-256 hash
    Consent->>DB: Store token_hash, expires_at (7 days), used=0
    Consent-->>API: rawToken, consentUrl
    API-->>Component: requestId, consentToken, consentUrl
    Applicant->>Guarantor: Shares secure single-use consent URL

    Guarantor->>Component: Opens consent URL
    Component->>API: GET /api/waas/consent/:token
    API->>Consent: verifyConsentToken(rawToken)
    Consent->>DB: Query token_hash (Check used=0 and expiry)
    Consent-->>API: Request details (Applicant name, purpose, scope)
    API-->>Component: Render consent review screen

    Guarantor->>Component: Clicks "Approve Guarantee"
    Component->>API: POST /api/waas/consent/:token/decide { decision: "approve" }
    API->>Consent: decideConsent(rawToken, "approve")
    Consent->>DB: UPDATE consent_tokens SET used=1, used_at=now
    Consent->>DB: UPDATE waas_requests SET status='approved', consent_guarantor=1
    Consent->>Adapter: issueCredential(requestId)
    
    alt Coordinator Available
        Adapter->>DCC: POST /credentials/issue (VC-API payload)
        DCC-->>Adapter: Signed Verifiable Credential
    else Coordinator Unavailable (Circuit Breaker Tripped)
        Adapter->>Adapter: Local Cryptographic Fallback Engine
        Adapter->>Adapter: HMAC-SHA256 tamper-evident proof
    end

    Adapter->>DB: INSERT INTO credentials (waas_id_public, status='VALID', signature...)
    Adapter-->>Consent: Issued credential object + QR Code
    Consent-->>API: Success + credential metadata
    API-->>Component: Displays congratulations & downloadable reference
```

---

## 4. Authoritative 6-Status Credential Lifecycle

Every credential query resolves to one of six authoritative statuses:

```mermaid
stateDiagram-v2
    [*] --> PENDING: Request Created (Awaiting Guarantor Review)
    PENDING --> DECLINED: Guarantor Declines Request
    DECLINED --> [*]
    PENDING --> VALID: Guarantor Approves & Credential Issued
    VALID --> SUSPENDED: Administrative Audit / Investigation Triggered
    SUSPENDED --> VALID: Audit Cleared (Reinstated)
    VALID --> REVOKED: Guarantor or Institution Revokes Commitment
    SUSPENDED --> REVOKED: Non-compliance Confirmed
    VALID --> EXPIRED: Expiration Date Surpassed (>365 days)
    SUSPENDED --> EXPIRED: Expiration Date Surpassed
    REVOKED --> [*]
    EXPIRED --> [*]
    [*] --> INVALID: Malformed WaaS ID or Cryptographic Proof Tampered
```

### Verification Status Definitions
| Status | Meaning | Public `isValid` | Actions Permitted |
| :--- | :--- | :---: | :--- |
| **`VALID`** | Active, verified reference signed by authorized guarantor. | `true` | Accepted by employers, universities, banks. |
| **`SUSPENDED`** | Temporarily frozen during document audit or procedural review. | `false` | Read-only; can be reinstated to `VALID` or escalated to `REVOKED`. |
| **`REVOKED`** | Terminated by guarantor or admin due to breach or job completion. | `false` | Permanent terminal state; displays audit reason. |
| **`EXPIRED`** | Credential exceeded validity period (default 1 year). | `false` | Archived; learner can request renewal. |
| **`PENDING`** | Request logged; consent not yet finalized by guarantor. | `false` | Awaiting guarantor action. |
| **`INVALID`** | Non-existent record or tampered cryptographic proof. | `false` | Immediate verification rejection. |

---

## 5. Multi-Tenant Architecture & Data Isolation

Lumo WaaS enforces strict tenant boundaries at the database and API gateway levels:

1. **Tenant Identification**: Inbound requests pass the `X-Tenant-ID` header (e.g. `alx_ethiopia`, `unhcr_partner`, `default`).
2. **Schema-Level Scoping**:
   - `waas_requests.tenant_id`: All guarantee requests are owned by an organization tenant.
   - `institutional_guarantors.tenant_id`: Accreditations are isolated per tenant.
   - `consent_tokens.tenant_id`: Tokens generated within Tenant A cannot be evaluated or listed within Tenant B.
   - `credentials.tenant_id`: Issued credentials carry the tenant context.
   - `organization_admins`: Role-based administrative assignments (`role IN ('admin','reviewer','auditor')`) restricted to authorized tenant records.
3. **Cross-Tenant Defense**: Any cross-tenant attempt to access request details yields an immediate `403 Forbidden` (`TENANT_MISMATCH`).

---

## 6. Resilient Circuit Breaker Pattern

To prevent external network partitions or downstream microservice restarts from halting educational and employment onboarding, the `IssuerCoordinatorAdapter` implements a stateful Circuit Breaker:

```
[Incoming Issuance Request]
            │
            ▼
    Is Circuit Breaker Open?
      ├── YES ──> Fallback to Local Cryptographic Engine (HMAC-SHA256)
      └── NO  ──> Attempt HTTP POST to DCC Issuer-Coordinator (:4005)
                     ├── 200 OK  ──> Reset Failures & Return Credential
                     └── Timeout / 5xx ──> Increment Failure Counter
                                             │
                                   Failures >= 3?
                                     ├── YES ──> Trip Breaker (OPEN for 30s)
                                     └── NO  ──> Local Cryptographic Engine Fallback
```

This guarantees 100% service uptime for displaced learners even during localized microservice outages.
