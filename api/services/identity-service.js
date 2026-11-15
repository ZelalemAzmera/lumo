/**
 * Identity Verification Service
 * Handles identity verification through multiple routes:
 * - refugee_id: Refugee ID document verification
 * - partner_referral: Verification through trusted partner organizations
 * - national_id: National ID verification (Fayda integration placeholder)
 */

const { v4: uuidv4 } = require('uuid');
const manualProvider = require('../providers/manual');
const partnerProvider = require('../providers/partner');
const faydaAdapter = require('../providers/fayda-adapter');

const VALID_ROUTES = ['refugee_id', 'partner_referral', 'national_id'];
const VALID_STATUSES = ['submitted', 'pending', 'verified', 'rejected', 'expired'];

class IdentityService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Submit an identity verification request.
   */
  async submit({ applicantId, route, documentRef }) {
    if (!applicantId) {
      throw { status: 400, message: 'applicant_id is required' };
    }
    if (!route || !VALID_ROUTES.includes(route)) {
      throw { status: 422, message: `route must be one of: ${VALID_ROUTES.join(', ')}` };
    }

    // Check applicant exists
    const applicant = this.db.prepare('SELECT id FROM applicants WHERE id = ?').get(applicantId);
    if (!applicant) {
      throw { status: 404, message: 'Applicant not found' };
    }

    const id = uuidv4();
    let providerResult;

    switch (route) {
      case 'refugee_id':
        providerResult = await manualProvider.submit(documentRef, applicantId);
        break;
      case 'partner_referral':
        providerResult = await partnerProvider.submit({
          partnerOrg: documentRef,
          referralRef: `REF-${id.slice(0, 8)}`,
          applicantId
        });
        break;
      case 'national_id':
        providerResult = faydaAdapter.verify(documentRef);
        if (!providerResult.available) {
          // Fall back to manual verification for national IDs
          providerResult = await manualProvider.submit(documentRef, applicantId);
          providerResult.note = 'Fayda integration not yet available — using manual verification';
        }
        break;
    }

    const status = providerResult.status === 'not_available' ? 'submitted' : providerResult.status || 'submitted';

    this.db.prepare(`
      INSERT INTO identity_verifications (id, applicant_id, route, document_ref, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, applicantId, route, documentRef || null, status);

    // Update applicant id_route
    this.db.prepare('UPDATE applicants SET id_route = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(route, applicantId);

    // Audit log
    this.db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'identity_verification_submitted', 'identity_verification', id, 'system',
      JSON.stringify({ route, applicantId }));

    return {
      id,
      applicantId,
      route,
      status,
      provider: providerResult
    };
  }

  /**
   * Get the status of an identity verification.
   */
  getStatus(verificationId) {
    if (!verificationId) {
      throw { status: 400, message: 'verification_id is required' };
    }

    const verification = this.db.prepare(`
      SELECT iv.*, a.full_name as applicant_name
      FROM identity_verifications iv
      JOIN applicants a ON iv.applicant_id = a.id
      WHERE iv.id = ?
    `).get(verificationId);

    if (!verification) {
      throw { status: 404, message: 'Verification not found' };
    }

    return {
      id: verification.id,
      applicantId: verification.applicant_id,
      applicantName: verification.applicant_name,
      route: verification.route,
      status: verification.status,
      verifiedBy: verification.verified_by,
      createdAt: verification.created_at,
      updatedAt: verification.updated_at
    };
  }
}

module.exports = IdentityService;
