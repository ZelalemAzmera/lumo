/**
 * Partner-assisted verification provider.
 * Enables trusted partner organizations to vouch for applicant identity.
 */

class PartnerVerificationProvider {
  constructor() {
    this.name = 'partner_referral';
    this.description = 'Identity verification through trusted partner organizations';
    this.trustedPartners = [
      'ALX Ethiopia',
      'SNV',
      'Mercy Corps',
      'AAAPD',
      'UNHCR',
      'IOM'
    ];
  }

  /**
   * Submit a partner referral for verification.
   */
  async submit(referralData) {
    const { partnerOrg, referralRef, applicantId } = referralData;

    if (!partnerOrg || !referralRef) {
      throw new Error('Partner organization and referral reference are required');
    }

    const isTrusted = this.trustedPartners.some(
      p => p.toLowerCase() === partnerOrg.toLowerCase()
    );

    return {
      provider: this.name,
      status: isTrusted ? 'pending' : 'submitted',
      message: isTrusted
        ? 'Referral from trusted partner — expedited review'
        : 'Referral submitted for standard partner verification',
      partnerOrg,
      referralRef,
      applicantId,
      isTrustedPartner: isTrusted,
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * Check partner referral status.
   */
  async checkStatus(verificationId) {
    return {
      provider: this.name,
      verificationId,
      status: 'pending',
      message: 'Partner referral verification in progress'
    };
  }
}

module.exports = new PartnerVerificationProvider();
