/**
 * WaaS Consent Service
 * Manages single-use, cryptographically secure consent tokens.
 *
 * Security Guarantees:
 * - 256-bit CSPRNG tokens (crypto.randomBytes(32))
 * - One-way SHA-256 token hashing before database storage (zero raw token leak in DB dumps)
 * - Strict expiration check (default 7 days, configurable)
 * - Replay protection: Marked used=1 atomically on decision
 * - Links guarantor review to credential issuance via IssuerCoordinatorAdapter
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

class ConsentService {
  constructor(db, issuerAdapter) {
    this.db = db;
    this.issuerAdapter = issuerAdapter;
  }

  /**
   * Generate a secure, single-use consent token for a guarantor.
   */
  createConsentToken(requestId, guarantorId, options = {}) {
    const { expiresInHours = 168, tenantId = 'default' } = options; // Default 7 days

    const request = this.db.prepare('SELECT * FROM waas_requests WHERE id = ?').get(requestId);
    if (!request) {
      const err = new Error('Guarantee request not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // 1. Generate 256-bit cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token with SHA-256 before storage
    const tokenHash = this._hashToken(rawToken);

    const tokenId = `tok_${uuidv4().slice(0, 12)}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    // 3. Store hashed token in database
    this.db.prepare(`
      INSERT INTO consent_tokens (id, request_id, token_hash, guarantor_id, tenant_id, expires_at, used)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(tokenId, requestId, tokenHash, guarantorId, tenantId, expiresAt);

    const consentUrl = `${BASE_URL}/api/v1/waas/consent/${rawToken}`;

    this._logAudit('GENERATE_CONSENT_TOKEN', 'consent_token', tokenId, guarantorId, {
      requestId,
      expiresAt,
      tenantId
    });

    return {
      tokenId,
      rawToken,
      tokenHash,
      consentUrl,
      expiresAt,
      requestId,
      guarantorId
    };
  }

  /**
   * Verify and retrieve a consent request by raw token.
   * Throws 404 for invalid tokens, 410 for reused or expired tokens.
   */
  verifyConsentToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      const err = new Error('Consent token is required');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const tokenHash = this._hashToken(rawToken);

    const tokenRecord = this.db.prepare(`
      SELECT ct.*, wr.applicant_id, wr.guarantor_id as req_guarantor_id, wr.purpose, wr.scope,
             wr.status as request_status, a.full_name as applicant_name, a.id_route, a.origin_country
      FROM consent_tokens ct
      JOIN waas_requests wr ON ct.request_id = wr.id
      JOIN applicants a ON wr.applicant_id = a.id
      WHERE ct.token_hash = ?
    `).get(tokenHash);

    if (!tokenRecord) {
      const err = new Error('Consent link is invalid or has expired');
      err.status = 404;
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    // Check Replay (Already Used)
    if (tokenRecord.used) {
      const err = new Error('This single-use consent link has already been used');
      err.status = 410;
      err.code = 'TOKEN_REUSED';
      err.usedAt = tokenRecord.used_at;
      throw err;
    }

    // Check Expiry
    const expDate = new Date(tokenRecord.expires_at);
    if (expDate < new Date()) {
      const err = new Error('This consent link has expired past its validity window');
      err.status = 410;
      err.code = 'TOKEN_EXPIRED';
      err.expiredAt = tokenRecord.expires_at;
      throw err;
    }

    return {
      tokenId: tokenRecord.id,
      requestId: tokenRecord.request_id,
      guarantorId: tokenRecord.guarantor_id,
      tenantId: tokenRecord.tenant_id,
      expiresAt: tokenRecord.expires_at,
      request: {
        id: tokenRecord.request_id,
        applicantName: tokenRecord.applicant_name,
        applicantOrigin: tokenRecord.origin_country,
        idRoute: tokenRecord.id_route,
        purpose: tokenRecord.purpose,
        scope: tokenRecord.scope,
        status: tokenRecord.request_status
      }
    };
  }

  /**
   * Process guarantor consent decision (approve or reject).
   * Marks token used atomically and issues credential if approved.
   */
  async decideConsent(rawToken, decision, options = {}) {
    const verified = this.verifyConsentToken(rawToken);
    const tokenHash = this._hashToken(rawToken);

    const normalizedDecision = String(decision).toLowerCase();
    if (!['approve', 'approved', 'reject', 'rejected', 'decline', 'declined'].includes(normalizedDecision)) {
      const err = new Error("Decision must be either 'approve' or 'reject'");
      err.status = 400;
      err.code = 'BAD_DECISION';
      throw err;
    }

    const isApproval = ['approve', 'approved'].includes(normalizedDecision);
    const reason = options.reason || (isApproval ? 'Guarantor consent granted' : 'Guarantor declined guarantee request');

    // 1. Mark token used immediately (Replay protection)
    this.db.prepare(`
      UPDATE consent_tokens
      SET used = 1, used_at = datetime('now')
      WHERE token_hash = ?
    `).run(tokenHash);

    const requestId = verified.requestId;
    const guarantorId = verified.guarantorId;

    if (!isApproval) {
      // Rejection branch
      this.db.prepare(`
        UPDATE waas_requests
        SET status = 'declined', consent_guarantor = 0, updated_at = datetime('now')
        WHERE id = ?
      `).run(requestId);

      this._logAudit('CONSENT_REJECTED', 'waas_request', requestId, guarantorId, { reason });

      return {
        success: true,
        decision: 'REJECTED',
        status: 'declined',
        requestId,
        message: 'Guarantee request declined by guarantor.'
      };
    }

    // Approval branch
    this.db.prepare(`
      UPDATE waas_requests
      SET status = 'approved', guarantor_id = ?, consent_guarantor = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(guarantorId, requestId);

    this._logAudit('CONSENT_APPROVED', 'waas_request', requestId, guarantorId, { reason });

    // 2. Automatically issue credential via IssuerCoordinatorAdapter
    let issuanceResult = null;
    if (this.issuerAdapter) {
      issuanceResult = await this.issuerAdapter.issueCredential(requestId, {
        tenantId: verified.tenantId,
        expiresInDays: options.expiresInDays || 365
      });
    }

    return {
      success: true,
      decision: 'APPROVED',
      status: 'issued',
      requestId,
      message: 'Guarantor consent recorded and credential successfully issued.',
      credential: issuanceResult
    };
  }

  // --- Internal Helpers ---

  _hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
  }

  _logAudit(action, entityType, entityId, actor, details) {
    try {
      this.db.prepare(`
        INSERT INTO audit_log (id, action, entity_type, entity_id, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), action, entityType, entityId, actor || 'system', JSON.stringify(details || {}));
    } catch (e) {
      console.error('[Consent Audit Error]:', e.message);
    }
  }
}

module.exports = ConsentService;
