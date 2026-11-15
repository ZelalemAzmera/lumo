/**
 * Credential Service
 * Issues Open Badges 3.0-compatible credentials.
 * Signs with HMAC-SHA256. Generates QR codes.
 * Never exposes private identity documents.
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const SIGNING_SECRET = process.env.WAAS_SIGNING_SECRET || 'waas_demo_secret_2026';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

class CredentialService {
  constructor(db) {
    this.db = db;
    // Ensure QR output directory exists
    const qrDir = path.join(__dirname, '..', 'public', 'qr');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
  }

  /**
   * Issue a WaaS credential for an approved request.
   */
  async issue(waasRequestId) {
    const request = this.db.prepare(`
      SELECT wr.*, a.full_name as applicant_name
      FROM waas_requests wr
      JOIN applicants a ON wr.applicant_id = a.id
      WHERE wr.id = ?
    `).get(waasRequestId);

    if (!request) {
      throw { status: 404, message: 'WaaS request not found' };
    }

    if (request.status !== 'approved') {
      throw { status: 422, message: 'WaaS request must be approved before issuing a credential' };
    }

    // Generate public WaaS ID (human-readable, non-sensitive)
    const waasIdPublic = `WAAS-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
    const credentialId = uuidv4();
    const issueDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    // Build Open Badges 3.0-compatible credential
    const credential = {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
      ],
      id: `urn:uuid:${credentialId}`,
      type: ['VerifiableCredential', 'OpenBadgeCredential', 'WaaSCredential'],
      issuer: {
        id: `${BASE_URL}/api/v1/issuer`,
        type: 'Profile',
        name: 'WaaS Platform — Digital ዋስ'
      },
      issuanceDate: issueDate,
      expirationDate: expiryDate,
      credentialSubject: {
        id: `urn:waas:${waasIdPublic}`,
        type: 'WaaSBeneficiary',
        // Never expose private identity documents — only reference IDs
        beneficiaryRef: request.applicant_id,
        guarantorRef: request.guarantor_id,
        purpose: request.purpose,
        scope: request.scope || 'general'
      },
      credentialStatus: {
        id: `${BASE_URL}/api/v1/waas/verify/${waasIdPublic}`,
        type: 'WaaSStatusCheck'
      }
    };

    // Sign the credential
    const signature = this._sign(credential);

    // Generate QR code
    const verificationUrl = `${BASE_URL}/api/v1/waas/verify/${waasIdPublic}`;
    const qrFilename = `${waasIdPublic}.png`;
    const qrPath = path.join(__dirname, '..', 'public', 'qr', qrFilename);

    await QRCode.toFile(qrPath, verificationUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#172B3A', light: '#FAFAF7' }
    });

    // Get identity verification tier
    const idVerification = this.db.prepare(`
      SELECT route, status FROM identity_verifications
      WHERE applicant_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(request.applicant_id);

    const idTier = idVerification ? `${idVerification.route}:${idVerification.status}` : 'unverified';

    // Store credential
    this.db.prepare(`
      INSERT INTO credentials (id, waas_request_id, waas_id_public, credential_type, beneficiary_ref, guarantor_ref,
        id_verification_tier, verification_status, issuer, issue_date, expiry_date, scope, signature, qr_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      credentialId, waasRequestId, waasIdPublic, 'WaaSCredential',
      request.applicant_id, request.guarantor_id,
      idTier, 'VALID', 'WaaS Platform', issueDate, expiryDate,
      request.scope || 'general', signature, `/qr/${qrFilename}`
    );

    // Update request status
    this.db.prepare(`
      UPDATE waas_requests SET status = 'issued', updated_at = datetime('now') WHERE id = ?
    `).run(waasRequestId);

    // Audit log
    this.db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'credential_issued', 'credential', credentialId, 'system',
      JSON.stringify({ waasIdPublic, waasRequestId }));

    return {
      credentialId,
      waasIdPublic,
      verificationUrl,
      qrCodeUrl: `${BASE_URL}/qr/${qrFilename}`,
      credential,
      signature,
      issuedAt: issueDate,
      expiresAt: expiryDate
    };
  }

  /**
   * Sign credential payload with HMAC-SHA256.
   */
  _sign(payload) {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', SIGNING_SECRET).update(data).digest('hex');
  }
}

module.exports = CredentialService;
