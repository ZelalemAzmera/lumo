/**
 * Manual verification provider (demo mode).
 * Simulates a manual review process where a human verifier checks documents.
 */

class ManualVerificationProvider {
  constructor() {
    this.name = 'manual';
    this.description = 'Manual document verification by trained staff';
  }

  /**
   * Submit a document for manual verification.
   * In demo mode, returns 'pending' status immediately.
   */
  async submit(documentRef, applicantId) {
    return {
      provider: this.name,
      status: 'pending',
      message: 'Document submitted for manual review',
      documentRef,
      applicantId,
      estimatedProcessingTime: '1-3 business days',
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * Check the status of a manual verification.
   * In demo mode, returns 'pending' for recent submissions.
   */
  async checkStatus(verificationId) {
    return {
      provider: this.name,
      verificationId,
      status: 'pending',
      message: 'Awaiting manual review by trained verification staff'
    };
  }

  /**
   * Complete a manual verification (staff action).
   */
  async complete(verificationId, decision, verifierName) {
    const validDecisions = ['verified', 'rejected'];
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid decision: ${decision}. Must be one of: ${validDecisions.join(', ')}`);
    }

    return {
      provider: this.name,
      verificationId,
      status: decision,
      verifiedBy: verifierName || 'demo_verifier',
      completedAt: new Date().toISOString()
    };
  }
}

module.exports = new ManualVerificationProvider();
