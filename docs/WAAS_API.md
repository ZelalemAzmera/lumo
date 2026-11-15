# Digital WaaS (ዋስ) — API Reference & Integration Guide

**REST API Specification for Guarantor and Verification as a Service**  
*ALX Ethiopia Digital Bridge Hackathon 2026*

---

## 1. Global Endpoints & Base URLs

The WaaS service is accessible via two compatible engines sharing a synchronized persistence layer (`api/database/waas.db`):
- **Node.js Express Engine**: `http://localhost:3001/api/v1`
- **Python FastAPI Gateway**: `http://localhost:8000/v1` and `http://localhost:8000/api/v1`

### Authentication & Headers
- **Public Endpoints**: `/health`, `/guarantors`, `/waas/request`, `/waas/match/:id`, `/waas/verify/:id` require no authentication headers.
- **Protected Endpoints**: `/waas/revoke/:id`, `/waas/audit`, `/guarantors/:id/verify` require:
  - Header: `X-Waas-Token: <token>` OR `X-Lumo-Key: <token>` OR `Authorization: Bearer <token>`
  - Provisioned development keys: `waas_demo_token_2026`, `alx_savanna_tenant_key_2026`

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
  "timestamp": "2026-11-16T01:25:23.000Z"
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

### 2.3 Non-Exclusionary Identity Ingestion
#### `POST /api/v1/identity/submit`
Submits applicant identity for verification without mandatory national ID requirement.

**Request Body:**
```json
{
  "fullName": "Fatima Ahmed",
  "phone": "+251911000111",
  "route": "refugee_id",
  "documentRef": "UNHCR-ETH-2024-98765"
}
```

**Supported Routes:**
- `refugee_id`: UNHCR / RRS refugee manifest or identification card.
- `partner_referral`: Trusted NGO, vocational institute, or community sponsor vouching.
- `national_id`: Fayda or Kebele ID (automatically routed to human fallback if offline).

**Response (200 OK):**
```json
{
  "success": true,
  "identityId": "d74a1e9b-4e12-402a-a9fa-8083a37b1294",
  "applicantId": "app_424f1283-4",
  "status": "pending",
  "route": "refugee_id"
}
```

---

### 2.4 Guarantee Request Creation
#### `POST /api/v1/waas/request`
Creates an applicant guarantee request with mandatory explicit consent.

**Request Body:**
```json
{
  "applicantName": "Fatima Ahmed",
  "phone": "+251911000111",
  "email": "fatima.refugee@example.org",
  "purpose": "scholarship",
  "courseRef": "track2-alx-ai-foundations",
  "guarantorType": "institutional",
  "consentApplicant": true,
  "scope": "Professional Reference & Educational Endorsement"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "requestId": "req_424f1283-4",
  "applicantId": "app_424f1283-4",
  "status": "pending",
  "message": "Guarantee request submitted successfully and queued for guarantor review."
}
```

---

### 2.5 Explainable Matchmaking
#### `GET /api/v1/guarantors/match/:requestId`
Returns matched potential guarantors with human-readable rationale.
*Ethical Constraint: No black-box scores, credit ratings, or numeric rankings 0–100.*

**Response (200 OK):**
```json
{
  "requestId": "req_424f1283-4",
  "status": "eligible",
  "explanation": "Guarantors identified based on accreditation and requested purpose",
  "matches": [
    {
      "id": "inst-alx-ethiopia",
      "type": "institutional",
      "name": "ALX Ethiopia Education Partner",
      "purposeMatch": true,
      "scopeLimitations": "Covers certified software & digital skills graduates for professional placements",
      "matchReason": "Institution is accredited and supports this category of endorsement",
      "eligibilityReason": "Organization is verified and endorses this type of purpose"
    }
  ],
  "nextSteps": ["Select a guarantor to proceed with the WaaS request"]
}
```

---

### 2.6 Guarantor Consent & Decision
#### `POST /api/v1/waas/:id/approve`
Guarantor approves a pending request with verifiable consent.

**Request Body:**
```json
{
  "guarantorId": "inst-alx-ethiopia",
  "guarantorConsent": true,
  "termsAccepted": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "requestId": "req_424f1283-4",
  "status": "APPROVED",
  "message": "Request approved by guarantor. Credential can now be issued."
}
```

---

### 2.7 Open Badges 3.0 Credential Issuance
#### `POST /api/v1/waas/:id/issue`
Issues an Open Badges 3.0 / W3C Verifiable Credential with HMAC-SHA256 signature and QR code.

**Response (200 OK):**
```json
{
  "success": true,
  "waasId": "WAAS-MWIEKTMQ-70CF8C",
  "issuedAt": "2026-11-16T01:25:23.000Z",
  "expiresAt": "2027-11-16T01:25:23.000Z",
  "qrCodeDataUrl": "/qr/WAAS-MWIEKTMQ-70CF8C.png",
  "credential": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    "id": "urn:uuid:7f3a8b2c-2026-4a11-b984-alxbridge001",
    "type": ["VerifiableCredential", "OpenBadgeCredential", "WaaSCredential"],
    "issuer": {
      "id": "http://localhost:3001/api/v1/issuer",
      "type": "Profile",
      "name": "WaaS Platform — Digital ዋስ"
    },
    "credentialSubject": {
      "id": "urn:waas:WAAS-MWIEKTMQ-70CF8C",
      "type": "WaaSBeneficiary",
      "beneficiaryRef": "app_424f1283-4",
      "guarantorRef": "inst-alx-ethiopia",
      "purpose": "scholarship",
      "scope": "Professional Reference & Educational Endorsement"
    }
  },
  "signature": "3a8b2c..."
}
```

---

### 2.8 Public Credential Verification (Zero Leak)
#### `GET /api/v1/waas/verify/:waasId`
Publicly verifies credential validity without leaking private identity records.

**Response (200 OK — Active):**
```json
{
  "waasId": "WAAS-MWIEKTMQ-70CF8C",
  "status": "VALID",
  "message": "This WaaS credential is valid and active",
  "verified": true,
  "isValid": true,
  "signatureValid": true,
  "subject": {
    "name": "Fatima Ahmed",
    "beneficiaryRef": "app_424f1283-4"
  },
  "credential": {
    "type": "WaaSCredential",
    "issuer": "WaaS Platform",
    "issuedAt": "2026-11-16T01:25:23.000Z",
    "expiresAt": "2027-11-16T01:25:23.000Z",
    "purpose": "scholarship",
    "scope": "Professional Reference & Educational Endorsement"
  }
}
```

**Response (200 OK — Revoked):**
```json
{
  "waasId": "WAAS-MWIEKTMQ-70CF8C",
  "status": "REVOKED",
  "message": "This credential has been revoked",
  "revocationReason": "Course completed and guarantee term fulfilled",
  "verified": false,
  "isValid": false,
  "issuer": "WaaS Platform"
}
```

---

### 2.9 Revocation
#### `POST /api/v1/waas/revoke/:waasId` (Protected)
Revokes an active credential with reason and audit log record.

**Headers:**
`X-Waas-Token: waas_demo_token_2026`

**Request Body:**
```json
{
  "reason": "Applicant completed program requirements; guarantee term concluded normally."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "waasId": "WAAS-MWIEKTMQ-70CF8C",
  "status": "REVOKED",
  "message": "Credential successfully revoked."
}
```
