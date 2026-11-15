/**
 * Matching Service
 * Matches applicants to guarantors based on purpose, guarantor eligibility,
 * capacity, and active commitments.
 *
 * Returns explainable statuses — NEVER a trust score 0-100.
 * Never describes refugees as untrustworthy.
 */

class MatchingService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Matching statuses with human-readable explanations.
   */
  static STATUSES = {
    ELIGIBLE: {
      code: 'eligible',
      description: 'A suitable guarantor is available and willing to support this request'
    },
    ADDITIONAL_VERIFICATION: {
      code: 'additional_verification_required',
      description: 'Additional identity verification is needed before matching can proceed'
    },
    PENDING_INSTITUTIONAL: {
      code: 'pending_institutional_approval',
      description: 'An institutional guarantor has been identified; awaiting their organizational approval process'
    },
    NOT_CURRENTLY_ELIGIBLE: {
      code: 'not_currently_eligible',
      description: 'No guarantors currently available for this type of request — this may change as new guarantors register'
    },
    UNDER_REVIEW: {
      code: 'under_review',
      description: 'The request is being reviewed to find the best match'
    }
  };

  /**
   * Find matching guarantors for a WaaS request.
   */
  findMatches(requestId) {
    const request = this.db.prepare(`
      SELECT wr.*, a.full_name as applicant_name, a.purpose as applicant_purpose, a.id_route
      FROM waas_requests wr
      JOIN applicants a ON wr.applicant_id = a.id
      WHERE wr.id = ?
    `).get(requestId);

    if (!request) {
      throw { status: 404, message: 'WaaS request not found' };
    }

    // Check identity verification status
    const idVerification = this.db.prepare(`
      SELECT status FROM identity_verifications
      WHERE applicant_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(request.applicant_id);

    if (!idVerification || !['verified', 'pending'].includes(idVerification.status)) {
      return {
        requestId,
        status: MatchingService.STATUSES.ADDITIONAL_VERIFICATION.code,
        explanation: MatchingService.STATUSES.ADDITIONAL_VERIFICATION.description,
        matches: [],
        nextSteps: ['Complete identity verification before matching can proceed']
      };
    }

    const guarantorType = request.guarantor_type;
    let candidates = [];

    if (guarantorType === 'individual') {
      candidates = this._findIndividualGuarantors(request);
    } else if (guarantorType === 'institutional') {
      candidates = this._findInstitutionalGuarantors(request);
    } else {
      // Search both
      candidates = [
        ...this._findIndividualGuarantors(request),
        ...this._findInstitutionalGuarantors(request)
      ];
    }

    if (candidates.length === 0) {
      return {
        requestId,
        status: MatchingService.STATUSES.NOT_CURRENTLY_ELIGIBLE.code,
        explanation: MatchingService.STATUSES.NOT_CURRENTLY_ELIGIBLE.description,
        matches: [],
        nextSteps: ['More guarantors may register soon', 'Consider broadening the request scope']
      };
    }

    // Check if any institutional match needs approval
    const hasInstitutional = candidates.some(c => c.type === 'institutional');
    const allInstitutional = candidates.every(c => c.type === 'institutional');

    let status, explanation;
    if (allInstitutional) {
      status = MatchingService.STATUSES.PENDING_INSTITUTIONAL.code;
      explanation = MatchingService.STATUSES.PENDING_INSTITUTIONAL.description;
    } else {
      status = MatchingService.STATUSES.ELIGIBLE.code;
      explanation = MatchingService.STATUSES.ELIGIBLE.description;
    }

    return {
      requestId,
      status,
      explanation,
      matches: candidates,
      nextSteps: status === 'eligible'
        ? ['Select a guarantor to proceed with the WaaS request']
        : ['Await institutional approval process']
    };
  }

  /**
   * Find eligible individual guarantors.
   */
  _findIndividualGuarantors(request) {
    const guarantors = this.db.prepare(`
      SELECT ig.*,
        (SELECT COUNT(*) FROM waas_requests wr
         WHERE wr.guarantor_id = ig.id
         AND wr.guarantor_type = 'individual'
         AND wr.status IN ('matched','approved','issued')) as active_commitments
      FROM individual_guarantors ig
      WHERE ig.consent_given = 1
      AND ig.id_status = 'verified'
    `).all();

    return guarantors
      .filter(g => g.active_commitments < g.max_active)
      .map(g => {
        const types = JSON.parse(g.guarantee_types_json || '[]');
        const purposeMatch = types.length === 0 || types.includes(request.purpose);
        return {
          id: g.id,
          type: 'individual',
          name: g.full_name,
          availableCapacity: g.max_active - g.active_commitments,
          purposeMatch,
          eligibilityReason: purposeMatch
            ? 'Guarantor is eligible and has available capacity'
            : 'Guarantor available but purpose type may not match their preferences'
        };
      })
      .filter(g => g.purposeMatch)
      .sort((a, b) => b.availableCapacity - a.availableCapacity);
  }

  /**
   * Find eligible institutional guarantors.
   */
  _findInstitutionalGuarantors(request) {
    const guarantors = this.db.prepare(`
      SELECT * FROM institutional_guarantors
      WHERE verified = 1
    `).all();

    return guarantors.map(g => {
      const types = JSON.parse(g.endorsement_types_json || '[]');
      const purposeMatch = types.length === 0 || types.includes(request.purpose);
      return {
        id: g.id,
        type: 'institutional',
        name: g.org_name,
        purposeMatch,
        scopeLimitations: g.scope_limitations,
        eligibilityReason: purposeMatch
          ? 'Organization is verified and endorses this type of purpose'
          : 'Organization verified but may not cover this purpose type'
      };
    })
    .filter(g => g.purposeMatch);
  }
}

module.exports = MatchingService;
