# Digital WaaS (ዋስ) — API Reference & Integration Guide

**REST API Specification for Guarantor and Verification as a Service with DCC Issuer Coordinator Integration**  
*ALX Ethiopia Digital Bridge Hackathon 2026*

---

## 1. Global Endpoints & Base URLs

The WaaS service is accessible via two compatible engines sharing a synchronized persistence layer (`api/database/waas.db`):
- **Node.js Express Engine**: `http://localhost:3001/api/v1` and `http://localhost:3001/api/waas`
- **Python FastAPI Gateway**: `http://localhost:8000/v1` and `http://localhost:8000/api/v1`
- **Isolated DCC Issuer Coordinator**: `http://localhost:4005` (Internal network only)

### Authentication & Authorization Headers
- **Public Endpoints**: `/health`, `/guarantors`, `/waas/requests` (POST), `/waas/consent/:token` (GET/POST), `/waas/verify/:id` (GET). No auth header required.
- **Tenant Context**: Optional header `X-Tenant-ID: <tenant_id>` isolates records across independent educational or humanitarian organizations.
- **Protected Operator Endpoints**: `/waas/credentials/:id/revoke`, `/waas/credentials/:id/suspend`, `/waas/credentials/:id/reinstate`, `/waas/audit`, `/guarantors/:id/verify`.
  - Header: `X-Waas-Token: <token>` OR `X-Lumo-Key: <token>` OR `Authorization: Bearer <token>`
  - Provisioned keys: `waas_demo_token_2026`, `alx_savanna_tenant_key_2026`

---

## 2. API Endpoints

### 2.1 Health & Diagnostics
#### `GET /api/v1/health`
Returns system diagnostics, database connection status, and service identification.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Lumo-WaaS-Plugin",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-11-16T01:55:00.000Z"
}
```

---

### 2.2 Guarantor Directory (Data-Minimized)
#### `GET /api/v1/guarantors`
Returns verified institutional and individual guarantors with available capacity.
*Privacy Rule: Personal phone numbers, physical addresses, and confidential partner registration documents are never exposed.*

**Response (200 OK):**
```json
{
  "institutions": [
    {
      "id": "inst-alx-ethiopia",
      "name": "ALX Ethiopia Education Partner",
      "type": "institutional",
      "registrationRef": "REG-ETH-EDU-2024-8891",
      "endorsementTypes": ["education", "employment", "internship"],
      "scope": "Covers certified software & digital skills graduates for professional placements"
    }
  ],
  "individuals": [
    {
      "id": "guar-indiv-abebe",
      "name": "Abebe Kebede (Senior Software Architect)",
      "type": "individual",
      "guaranteeTypes": ["employment", "training"],
      "capacity": 3
    }
  ],
  "guarantors": [...]
}
```

---

### 2.3 Guarantee Request Creation (with Secure Single-Use Consent Token)
#### `POST /api/waas/requests` (also `/api/v1/waas/request`)
Creates a new applicant guarantee request, registers non-exclusionary identity, and generates a cryptographically random, single-use consent token for the chosen guarantor.

**Request Body:**
```json
{
  "applicantName": "Tigist Hailu",
  "phone": "+251911223344",
  "email": "tigist@example.org",
  "lang": "am",
  "originCountry": "Ethiopia",
  "idRoute": "refugee_id",
  "purpose": "education",
  "courseRef": "alx-software-engineering",
  "scope": "Academic Excellence & Employment Endorsement",
  "guarantorType": "institutional",
  "guarantorId": "inst-alx-ethiopia",
  "consentApplicant": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "requestId": "req_8a1d3200-9",
  "applicantId": "app_8a1d3200-9",
  "guarantorId": "inst-alx-ethiopia",
  "consentToken": "4e7f9a2b1c8d3e5f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
  "consentUrl": "/api/waas/consent/4e7f9a2b1c8d3e5f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
  "status": "pending",
  "message": "Guarantee request submitted successfully and queued for guarantor review."
}
```

---

### 2.4 Single-Use Consent Inspection
#### `GET /api/waas/consent/:token`
Guarantor accesses the single-use link to review the applicant's request details.
*Security: Token is matched against SHA-256 hash in database. Reused or expired links return 410 Gone.*

**Response (200 OK):**
```json
{
  "success": true,
  "tokenId": "tok_1a2b3c4d",
  "requestId": "req_8a1d3200-9",
  "guarantorId": "inst-alx-ethiopia",
  "tenantId": "default",
  "expiresAt": "2026-11-23T01:55:00.000Z",
  "request": {
    "id": "req_8a1d3200-9",
    "applicantName": "Tigist Hailu",
    "applicantOrigin": "Ethiopia",
    "idRoute": "refugee_id",
    "purpose": "education",
    "scope": "Academic Excellence & Employment Endorsement",
    "status": "pending"
  }
}
```

**Error Responses:**
- `404 Not Found`: `{ "error": "INVALID_TOKEN", "message": "Consent link is invalid" }`
- `410 Gone`: `{ "error": "TOKEN_REUSED", "message": "This single-use consent link has already been used" }`
- `410 Gone`: `{ "error": "TOKEN_EXPIRED", "message": "This consent link has expired past its validity window" }`

---

### 2.5 Guarantor Consent Decision (Replay-Protected & Auto-Issuance)
#### `POST /api/waas/consent/:token/decide`
Guarantor makes their formal consent decision.
*Behavior: Atomically marks token as `used=1`. If decision is `approve`, triggers automatic credential issuance via `IssuerCoordinatorAdapter`.*

**Request Body (Approval):**
```json
{
  "decision": "approve",
  "reason": "Verified academic standing and course completion in ALX track",
  "expiresInDays": 365
}
```

**Response (200 OK — Approved & Issued):**
```json
{
  "success": true,
  "decision": "APPROVED",
  "status": "approved",
  "requestId": "req_8a1d3200-9",
  "message": "Guarantor consent recorded and credential successfully issued.",
  "credential": {
    "waasId": "WAAS-MWIFP38D-8839AD",
    "waasIdPublic": "WAAS-MWIFP38D-8839AD",
    "verificationUrl": "/api/waas/verify/WAAS-MWIFP38D-8839AD",
    "qrCodeUrl": "/public/qr/WAAS-MWIFP38D-8839AD.png",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "issuanceMode": "issuer_coordinator",
    "credential": {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
      ],
      "id": "urn:uuid:7f3a8b2c-2026-4a11-b984-alxbridge001",
      "type": ["VerifiableCredential", "OpenBadgeCredential", "WaaSCredential"],
      "issuer": { "id": "urn:lumo:issuer:inst-alx-ethiopia", "name": "ALX Ethiopia Education Partner" },
      "credentialSubject": {
        "id": "urn:waas:WAAS-MWIFP38D-8839AD",
        "name": "Tigist Hailu",
        "purpose": "education"
      }
    },
    "signature": "3f4a9b2c..."
  }
}
```

**Request Body (Decline):**
```json
{
  "decision": "reject",
  "reason": "Guarantor maximum active commitments reached"
}
```

**Response (200 OK — Declined):**
```json
{
  "success": true,
  "decision": "REJECTED",
  "status": "declined",
  "requestId": "req_8a1d3200-9",
  "message": "Guarantee request declined by guarantor."
}
```

---

### 2.6 Dedicated Credential Issuance
#### `POST /api/waas/requests/:id/issue` (also `/api/v1/waas/:id/issue`)
Manually issues a credential for an already-approved request.
*Protection: Returns `422 NOT_APPROVED` if unapproved; returns `409 DUPLICATE_ISSUANCE` if already issued.*

**Headers:**
- `X-Waas-Token: waas_demo_token_2026`

**Request Body (Optional Fallback Testing):**
```json
{
  "forceLocal": true
}
```

---

### 2.7 Authoritative 6-Status Public Verification
#### `GET /api/waas/verify/:id` (also `/api/v1/waas/verify/:id`)
Public verification endpoint requiring zero authentication.
*Guarantees zero data leakage: never returns phone numbers, identity numbers, or raw documents.*

**Possible Verification Statuses:**
1. `VALID`: Active, valid credential. `isValid: true`.
2. `SUSPENDED`: Temporarily suspended pending administrative review. `isValid: false`.
3. `REVOKED`: Terminated by guarantor or admin. `isValid: false`.
4. `EXPIRED`: Credential validity date exceeded. `isValid: false`.
5. `PENDING`: Request logged; not yet approved. `isValid: false`.
6. `INVALID`: Non-existent WaaS ID or tampered signature. `isValid: false`.

**Sample Response (`VALID`):**
```json
{
  "waasId": "WAAS-MWIFP38D-8839AD",
  "status": "VALID",
  "message": "This WaaS credential is valid and active",
  "verified": true,
  "isValid": true,
  "signatureValid": true,
  "subject": {
    "name": "Tigist Hailu",
    "beneficiaryRef": "app_8a1d3200-9"
  },
  "credential": {
    "type": "WaaSCredential",
    "issuer": "ALX Ethiopia Education Partner",
    "issuedAt": "2026-11-16T01:55:00.000Z",
    "expiresAt": "2027-11-16T01:55:00.000Z",
    "purpose": "education",
    "scope": "Academic Excellence & Employment Endorsement"
  }
}
```

---

### 2.8 Credential Suspension & Reinstatement (Protected)
#### `POST /api/waas/credentials/:id/suspend`
Temporarily freezes a credential during an administrative audit.

**Headers:**
- `X-Waas-Token: waas_demo_token_2026`

**Request Body:**
```json
{
  "reason": "Audit pending verification of supporting document"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "waasId": "WAAS-MWIFP38D-8839AD",
  "status": "SUSPENDED",
  "suspendedReason": "Audit pending verification of supporting document",
  "message": "Credential suspended successfully."
}
```

#### `POST /api/waas/credentials/:id/reinstate`
Reinstates a suspended credential back to `VALID` status.

**Headers:**
- `X-Waas-Token: waas_demo_token_2026`

**Request Body:**
```json
{
  "reason": "Audit cleared successfully"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "waasId": "WAAS-MWIFP38D-8839AD",
  "status": "VALID",
  "message": "Credential reinstated to VALID status."
}
```

---

### 2.9 Credential Revocation (Protected)
#### `POST /api/waas/credentials/:id/revoke`
Permanently revokes a credential.

**Headers:**
- `X-Waas-Token: waas_demo_token_2026`

**Request Body:**
```json
{
  "reason": "Student completed program and transitioned to permanent contract"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "waasId": "WAAS-MWIFP38D-8839AD",
  "status": "REVOKED",
  "message": "Credential successfully revoked."
}
```

---

### 2.10 Multi-Tenant Isolation
Any request with header `X-Tenant-ID: tenant_b` attempting to inspect `GET /api/waas/requests/:id` belonging to `tenant_a` is immediately rejected:

**Response (403 Forbidden):**
```json
{
  "error": "FORBIDDEN",
  "code": "TENANT_MISMATCH",
  "message": "Tenant mismatch: Cannot access records of another tenant organization."
}
```
