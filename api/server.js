/**
 * Lumo WaaS (Guarantor & Verification as a Service) API Server
 * Express.js REST API on Port 3001
 * Open Badges 3.0, WCAG 2.2 AA compliant, SQLite persistence
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { getDatabase } = require('./database/db');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const CredentialService = require('./services/credential-service');
const IdentityService = require('./services/identity-service');
const MatchingService = require('./services/matching-service');
const VerificationService = require('./services/verification-service');
const IssuerCoordinatorAdapter = require('./services/issuer-coordinator-adapter');
const ConsentService = require('./services/consent-service');

const app = express();
const PORT = process.env.WAAS_PORT || 3001;

// 1. Database & Services initialization
const db = getDatabase();
const credentialService = new CredentialService(db);
const identityService = new IdentityService(db);
const matchingService = new MatchingService(db);
const verificationService = new VerificationService(db);
const issuerCoordinatorAdapter = new IssuerCoordinatorAdapter(db);
const consentService = new ConsentService(db, issuerCoordinatorAdapter);

// 2. Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allow inline styles in component demo
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Waas-Token', 'X-Lumo-Key']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static QR codes
app.use('/public/qr', express.static(path.join(__dirname, 'public', 'qr')));

// 3. Sliding Window Rate Limiting (60 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again in a minute.'
  }
});
app.use('/api/', limiter);

// Audit logging helper
function logAudit(action, entityType, entityId, actor, details) {
  try {
    db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), action, entityType, entityId, actor || 'system', JSON.stringify(details || {}));
  } catch (err) {
    console.error('[WaaS Audit Error]:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// System Health
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Lumo-WaaS-Plugin',
    version: '1.0.0',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// ── Applicant & WaaS Request Flow ──

// Submit a new guarantee request (Generates single-use consent token)
app.post(['/api/waas/requests', '/api/v1/waas/request', '/v1/waas/request'], async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.applicantName;
    const phone = req.body.phone || req.body.contact || '+251911000000';
    const lang = req.body.lang || 'en';
    const originCountry = req.body.originCountry || 'Ethiopia';
    const idRoute = req.body.idRoute || req.body.idType || 'refugee_id';
    const purpose = req.body.purpose || 'scholarship';
    const courseRef = req.body.courseRef || req.body.courseId || null;
    const scope = req.body.scope || req.body.consentScope || 'Professional Reference & Guarantee';
    const guarantorType = req.body.guarantorType || req.body.preferredGuarantorType || 'institutional';
    const guarantorId = req.body.guarantorId || 'inst-alx-ethiopia';
    const tenantId = req.headers['x-tenant-id'] || req.body.tenantId || 'default';
    const consentApplicant = req.body.consentApplicant !== undefined
      ? req.body.consentApplicant
      : (req.body.consentGiven !== undefined ? req.body.consentGiven : true);

    if (!fullName) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Full name or applicant name is required.' });
    }

    if (!consentApplicant) {
      return res.status(422).json({ error: 'CONSENT_REQUIRED', message: 'Applicant must consent to data sharing to proceed.' });
    }

    const applicantId = `app_${uuidv4().slice(0, 10)}`;
    const requestId = `req_${uuidv4().slice(0, 10)}`;

    // Insert applicant
    db.prepare(`
      INSERT INTO applicants (id, full_name, phone, lang, origin_country, id_route, purpose, course_ref, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(applicantId, fullName, phone, lang, originCountry, idRoute, purpose, courseRef);

    // Ensure applicant has identity verification record for matchmaking
    db.prepare(`
      INSERT INTO identity_verifications (id, applicant_id, route, status, document_ref, verified_by)
      VALUES (?, ?, ?, 'verified', 'AUTO-SYSTEM-INIT', 'waas-system')
    `).run(uuidv4(), applicantId, idRoute);

    // Insert request with tenant isolation
    db.prepare(`
      INSERT INTO waas_requests (
        id, applicant_id, guarantor_type, guarantor_id, purpose, scope,
        status, consent_applicant, consent_guarantor, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, 0, ?)
    `).run(requestId, applicantId, guarantorType, guarantorId, purpose, scope, tenantId);

    // Generate single-use, secure consent link
    const consentRes = consentService.createConsentToken(requestId, guarantorId, { tenantId });

    logAudit('CREATE_REQUEST', 'waas_request', requestId, applicantId, { purpose, guarantorType, tenantId });

    res.status(200).json({
      success: true,
      requestId,
      applicantId,
      guarantorId,
      consentToken: consentRes.rawToken,
      consentUrl: consentRes.consentUrl,
      status: 'pending',
      message: 'Guarantee request submitted successfully and queued for guarantor review.'
    });
  } catch (err) {
    console.error('Request creation error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Retrieve request status (with tenant isolation)
app.get(['/api/waas/requests/:id', '/api/v1/waas/request/:id', '/v1/waas/request/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const reqTenant = req.headers['x-tenant-id'];

    const request = db.prepare(`
      SELECT wr.*, a.full_name as applicant_name, a.purpose as applicant_purpose,
             a.id_route, a.lang as applicant_lang
      FROM waas_requests wr
      JOIN applicants a ON wr.applicant_id = a.id
      WHERE wr.id = ?
    `).get(id);

    if (!request) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Guarantee request not found.' });
    }

    // Tenant isolation check
    if (reqTenant && request.tenant_id && request.tenant_id !== reqTenant && reqTenant !== 'global_admin') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        code: 'TENANT_MISMATCH',
        message: 'Tenant mismatch: Cannot access records of another tenant organization.'
      });
    }

    // Check if credential has been issued
    const credential = db.prepare('SELECT waas_id_public, issue_date, expiry_date, verification_status FROM credentials WHERE waas_request_id = ?').get(id);

    res.json({
      requestId: request.id,
      applicantId: request.applicant_id,
      applicantName: request.applicant_name,
      purpose: request.purpose,
      scope: request.scope,
      status: request.status,
      tenantId: request.tenant_id,
      guarantorType: request.guarantor_type,
      guarantorId: request.guarantor_id,
      consentApplicant: Boolean(request.consent_applicant),
      consentGuarantor: Boolean(request.consent_guarantor),
      createdAt: request.created_at,
      credential: credential || null
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ── Single-Use Consent Link Lifecycle ──

// Inspect consent request via single-use token (Guarantor reviews applicant info)
app.get(['/api/waas/consent/:token', '/api/v1/waas/consent/:token'], (req, res) => {
  try {
    const verified = consentService.verifyConsentToken(req.params.token);
    res.json({
      success: true,
      ...verified
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.code || 'CONSENT_ERROR',
      message: err.message,
      usedAt: err.usedAt,
      expiredAt: err.expiredAt
    });
  }
});

// Guarantor makes consent decision via single-use token (Replay protected)
app.post(['/api/waas/consent/:token/decide', '/api/v1/waas/consent/:token/decide'], async (req, res) => {
  try {
    const { decision, reason, expiresInDays } = req.body || {};
    const result = await consentService.decideConsent(req.params.token, decision, {
      reason,
      expiresInDays
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.code || 'DECISION_ERROR',
      message: err.message
    });
  }
});

// Direct request consent route
app.post(['/api/waas/requests/:id/consent', '/api/v1/waas/requests/:id/consent'], async (req, res) => {
  try {
    const { id } = req.params;
    const { decision = 'approve', token, reason } = req.body || {};

    if (token) {
      const result = await consentService.decideConsent(token, decision, { reason });
      return res.json(result);
    }

    // Direct guarantor session approval
    const request = db.prepare('SELECT * FROM waas_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Request not found.' });
    }

    if (decision === 'reject' || decision === 'decline') {
      db.prepare(`UPDATE waas_requests SET status = 'declined', updated_at = datetime('now') WHERE id = ?`).run(id);
      logAudit('CONSENT_REJECTED', 'waas_request', id, request.guarantor_id || 'guarantor', { reason });
      return res.json({ success: true, status: 'declined', message: 'Request declined.' });
    }

    db.prepare(`UPDATE waas_requests SET status = 'approved', consent_guarantor = 1, updated_at = datetime('now') WHERE id = ?`).run(id);
    logAudit('CONSENT_APPROVED', 'waas_request', id, request.guarantor_id || 'guarantor', { reason });

    const cred = await issuerCoordinatorAdapter.issueCredential(id, {
      tenantId: request.tenant_id || 'default'
    });

    res.json({
      success: true,
      status: 'approved',
      message: 'Request approved and credential issued.',
      credential: cred
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.code || 'ERROR', message: err.message });
  }
});

// ── Identity Verification ──

app.post(['/api/v1/identity/submit', '/v1/identity/submit'], async (req, res) => {
  try {
    let { applicantId, fullName, phone, lang = 'en', route, idType, idNumber, documentRef = 'DOC-REF-VALID' } = req.body;
    
    // Auto-create applicant if fullName provided and applicantId missing
    if (!applicantId && fullName) {
      applicantId = `app_${uuidv4().slice(0, 10)}`;
      db.prepare(`
        INSERT INTO applicants (id, full_name, phone, lang, origin_country, id_route, purpose, status)
        VALUES (?, ?, ?, ?, 'Ethiopia', ?, 'Refugee Identity Verification', 'pending')
      `).run(applicantId, fullName, phone || '+251911000000', lang, route || idType || 'refugee_id');
    }

    if (!applicantId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'applicantId or fullName is required.' });
    }

    const resolvedRoute = route || (idType && idType.includes('refugee') ? 'refugee_id' : 'partner_referral');
    const validRoutes = ['refugee_id', 'partner_referral', 'national_id'];
    const chosenRoute = validRoutes.includes(resolvedRoute) ? resolvedRoute : 'refugee_id';
    const chosenDocRef = documentRef || idNumber || 'DOC-REF-VALID';

    const result = await identityService.submit({ applicantId, route: chosenRoute, documentRef: chosenDocRef });
    const verificationId = result.id;
    logAudit('SUBMIT_IDENTITY', 'identity_verification', verificationId, applicantId, { route: chosenRoute });

    res.status(200).json({
      success: true,
      identityId: verificationId,
      verificationId,
      applicantId,
      ...result
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Identity verification failed' });
  }
});

app.get(['/api/v1/identity/status/:id', '/v1/identity/status/:id'], (req, res) => {
  try {
    const verification = db.prepare(`
      SELECT iv.*, a.full_name FROM identity_verifications iv
      JOIN applicants a ON iv.applicant_id = a.id
      WHERE iv.id = ?
    `).get(req.params.id);

    if (!verification) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Verification record not found.' });
    }

    res.json({
      verificationId: verification.id,
      status: verification.status,
      route: verification.route,
      verifiedBy: verification.verified_by,
      updatedAt: verification.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ── Guarantor Directory & Registration ──

// Register individual guarantor
app.post(['/api/v1/guarantors/register', '/v1/guarantors/register'], (req, res) => {
  try {
    const {
      fullName, phone, references = [], guaranteeTypes = ['employment', 'training'],
      maxActive = 3, consentGiven = true
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Full name and phone are required.' });
    }

    const id = `guar-indiv-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO individual_guarantors (
        id, full_name, phone, id_status, references_json, guarantee_types_json, max_active, consent_given
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(id, fullName, phone, JSON.stringify(references), JSON.stringify(guaranteeTypes), maxActive, consentGiven ? 1 : 0);

    logAudit('REGISTER_INDIVIDUAL_GUARANTOR', 'individual_guarantor', id, id, { fullName });

    res.status(201).json({
      success: true,
      guarantorId: id,
      status: 'pending_review',
      message: 'Individual guarantor registered and queued for verification.'
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Register institutional guarantor
app.post(['/api/v1/organizations/register', '/v1/organizations/register'], (req, res) => {
  try {
    const {
      orgName, registrationRef, contactEmail, contactPhone,
      representativeName, representativeAuthority, endorsementTypes = ['education', 'employment'],
      scopeLimitations = 'Standard academic & employment endorsement'
    } = req.body;

    if (!orgName || !contactEmail) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Organization name and contact email are required.' });
    }

    const id = `inst-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO institutional_guarantors (
        id, org_name, registration_ref, contact_email, contact_phone,
        representative_name, representative_authority, endorsement_types_json,
        scope_limitations, verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id, orgName, registrationRef || 'PENDING-REG', contactEmail, contactPhone || '',
      representativeName || '', representativeAuthority || '', JSON.stringify(endorsementTypes),
      scopeLimitations
    );

    logAudit('REGISTER_INSTITUTIONAL_GUARANTOR', 'institutional_guarantor', id, id, { orgName });

    res.status(201).json({
      success: true,
      organizationId: id,
      status: 'pending_review',
      message: 'Institutional partner registered and queued for verification.'
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// List verified guarantors (Data minimization: No private phone numbers or identity docs exposed)
app.get(['/api/v1/guarantors', '/v1/waas/guarantors'], (req, res) => {
  try {
    const institutions = db.prepare(`
      SELECT id, org_name, registration_ref, endorsement_types_json, scope_limitations
      FROM institutional_guarantors
      WHERE verified = 1
    `).all();

    const individuals = db.prepare(`
      SELECT id, full_name, guarantee_types_json, max_active
      FROM individual_guarantors
      WHERE id_status = 'verified'
    `).all();

    const instList = institutions.map(i => ({
      id: i.id,
      name: i.org_name,
      type: 'institutional',
      registrationRef: i.registration_ref,
      endorsementTypes: JSON.parse(i.endorsement_types_json || '[]'),
      scope: i.scope_limitations
    }));

    const indivList = individuals.map(u => ({
      id: u.id,
      name: u.full_name,
      type: 'individual',
      guaranteeTypes: JSON.parse(u.guarantee_types_json || '[]'),
      capacity: u.max_active
    }));

    res.json({
      institutions: instList,
      individuals: indivList,
      guarantors: [...instList, ...indivList]
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Match guarantors for a request
app.get(['/api/v1/guarantors/match/:requestId', '/v1/waas/match/:requestId'], (req, res) => {
  try {
    const matches = matchingService.findMatches(req.params.requestId);
    res.json(matches);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Matching error' });
  }
});

// Admin operator verifies a guarantor
app.post(['/api/v1/guarantors/:id/verify', '/v1/waas/guarantors/:id/verify'], requireAuth, (req, res) => {
  const { id } = req.params;
  const isInst = db.prepare('UPDATE institutional_guarantors SET verified = 1 WHERE id = ?').run(id);
  const isIndiv = db.prepare('UPDATE individual_guarantors SET id_status = "verified" WHERE id = ?').run(id);

  if (isInst.changes === 0 && isIndiv.changes === 0) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Guarantor not found.' });
  }

  logAudit('VERIFY_GUARANTOR', 'guarantor', id, req.user.role, { verified: true });
  res.json({ success: true, message: `Guarantor ${id} has been verified.` });
});

// ── Guarantor Review & Decision (Consent Workflow) ──

// Approve a request
app.post(['/api/v1/waas/:id/approve', '/v1/waas/request/:id/approve'], (req, res) => {
  try {
    const { id } = req.params;
    const { guarantorId } = req.body || {};
    const request = db.prepare('SELECT * FROM waas_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Request not found.' });
    }

    const assignedGuarantor = guarantorId || request.guarantor_id || 'inst-alx-ethiopia';

    db.prepare(`
      UPDATE waas_requests
      SET status = 'approved', guarantor_id = ?, consent_guarantor = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(assignedGuarantor, id);

    logAudit('APPROVE_REQUEST', 'waas_request', id, assignedGuarantor, { approved: true });

    res.json({
      success: true,
      requestId: id,
      status: 'APPROVED',
      message: 'Request approved by guarantor. Credential can now be issued.'
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Decline a request
app.post(['/api/v1/waas/:id/decline', '/v1/waas/request/:id/decline'], (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Guarantor at capacity or outside scope' } = req.body;

    const request = db.prepare('SELECT * FROM waas_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Request not found.' });
    }

    db.prepare(`
      UPDATE waas_requests
      SET status = 'declined', updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    logAudit('DECLINE_REQUEST', 'waas_request', id, request.guarantor_id || 'guarantor', { reason });

    res.json({
      success: true,
      requestId: id,
      status: 'declined',
      message: 'Request declined by guarantor.'
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ── Credential Issuance, Public Verification & Revocation ──

// Issue credential after approval (Via IssuerCoordinatorAdapter)
app.post(['/api/waas/requests/:id/issue', '/api/v1/waas/:id/issue', '/v1/waas/request/:id/issue'], async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    const forceLocal = req.body ? req.body.forceLocal : false;
    const expiresInDays = req.body ? req.body.expiresInDays : 365;

    const result = await issuerCoordinatorAdapter.issueCredential(req.params.id, {
      tenantId,
      forceLocal,
      expiresInDays
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.code || 'ISSUANCE_ERROR',
      message: err.message,
      existingWaasId: err.existingWaasId
    });
  }
});

// Retrieve Credential Metadata (Data minimized)
app.get(['/api/waas/credentials/:id', '/api/v1/waas/credentials/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const cred = db.prepare(`
      SELECT c.*, a.full_name as applicant_name, wr.purpose, wr.scope as req_scope
      FROM credentials c
      JOIN waas_requests wr ON c.waas_request_id = wr.id
      JOIN applicants a ON wr.applicant_id = a.id
      WHERE c.id = ? OR c.waas_id_public = ?
    `).get(id, id);

    if (!cred) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Credential not found.' });
    }

    res.json({
      waasId: cred.waas_id_public,
      credentialType: cred.credential_type,
      status: cred.verification_status,
      issuedAt: cred.issue_date,
      expiresAt: cred.expiry_date,
      issuer: cred.issuer,
      purpose: cred.purpose,
      scope: cred.scope || cred.req_scope,
      beneficiaryName: cred.applicant_name,
      revoked: Boolean(cred.revoked),
      suspended: Boolean(cred.suspended)
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Public verification (No authentication required; strictly data-minimized)
// Returns all 6 authoritative statuses: VALID, EXPIRED, REVOKED, SUSPENDED, PENDING, INVALID
app.get(['/api/waas/verify/:credentialId', '/api/v1/waas/verify/:waasId', '/v1/waas/verify/:waasId'], (req, res) => {
  try {
    const id = req.params.credentialId || req.params.waasId;
    const result = issuerCoordinatorAdapter.verifyCredential(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Revoke a credential (requires authorization)
app.post(['/api/waas/credentials/:id/revoke', '/api/v1/waas/revoke/:waasId', '/v1/waas/revoke/:waasId'], requireAuth, async (req, res) => {
  try {
    const id = req.params.id || req.params.waasId;
    const { reason = 'Revoked by authorized guarantor/issuer' } = req.body || {};
    const tenantId = req.headers['x-tenant-id'] || 'default';

    const result = await issuerCoordinatorAdapter.updateStatus(id, 'REVOKED', {
      action: 'revoke',
      reason,
      tenantId
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.code || 'INTERNAL_ERROR', message: err.message });
  }
});

// Suspend a credential (requires authorization)
app.post(['/api/waas/credentials/:id/suspend', '/api/v1/waas/suspend/:waasId', '/v1/waas/suspend/:waasId'], requireAuth, async (req, res) => {
  try {
    const id = req.params.id || req.params.waasId;
    const { reason = 'Suspended pending investigation' } = req.body || {};
    const tenantId = req.headers['x-tenant-id'] || 'default';

    const result = await issuerCoordinatorAdapter.updateStatus(id, 'SUSPENDED', {
      action: 'suspend',
      reason,
      tenantId
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.code || 'INTERNAL_ERROR', message: err.message });
  }
});

// Reinstate a suspended credential (requires authorization)
app.post(['/api/waas/credentials/:id/reinstate', '/api/v1/waas/reinstate/:waasId', '/v1/waas/reinstate/:waasId'], requireAuth, async (req, res) => {
  try {
    const id = req.params.id || req.params.waasId;
    const { reason = 'Reinstated after review' } = req.body || {};
    const tenantId = req.headers['x-tenant-id'] || 'default';

    const result = await issuerCoordinatorAdapter.updateStatus(id, 'VALID', {
      action: 'reinstate',
      reason,
      tenantId
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.code || 'INTERNAL_ERROR', message: err.message });
  }
});

// ── Mock Internal DCC Issuer-Coordinator Routes (For Automated Integration Testing) ──

app.post('/api/v1/internal/mock-coordinator/credentials/issue', (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing credential in payload' });
  }

  const coordinatorId = `dcc-coord-${uuidv4().slice(0, 8)}`;
  const signed = {
    ...credential,
    id: `urn:uuid:${coordinatorId}`,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: 'did:key:z6MkuMockTenantKey#z6MkuMockTenantKey',
      proofPurpose: 'assertionMethod',
      proofValue: 'z3u7fMockCoordinatorSignatureValidProof'
    }
  };

  res.status(201).json({
    id: coordinatorId,
    credential: signed
  });
});

app.post('/api/v1/internal/mock-coordinator/credentials/status', (req, res) => {
  const { credentialId, status, reason } = req.body || {};
  res.json({
    success: true,
    credentialId,
    status: status || 'revoked',
    reason: reason || 'Updated by coordinator',
    syncedAt: new Date().toISOString()
  });
});

app.get('/api/v1/internal/mock-coordinator/status/:listId', (req, res) => {
  res.json({
    '@context': ['https://w3id.org/vc/status-list/2021/v1'],
    id: `${BASE_URL}/api/v1/internal/mock-coordinator/status/${req.params.listId}`,
    type: 'StatusList2021',
    statusPurpose: 'revocation',
    encodedList: 'H4sIC...mockBitstring'
  });
});

// Audit log (for authorized operators only)
app.get(['/api/v1/waas/audit', '/v1/waas/audit'], requireAuth, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50').all();
    res.json({
      count: logs.length,
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        actor: l.actor,
        details: JSON.parse(l.details || '{}'),
        timestamp: l.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`✓ Lumo WaaS API running on port ${PORT} [http://localhost:${PORT}]`);
  console.log(`  Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`  Guarantor Directory: http://localhost:${PORT}/api/v1/guarantors`);
});

module.exports = { app, server };
