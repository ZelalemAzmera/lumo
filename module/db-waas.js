/**
 * ============================================================================
 * <db-waas> — Digital WaaS (ዋስ) Web Component
 * Refugee Guarantor & Institutional Verification Plugin
 * ALX Ethiopia Digital Bridge Accessibility Hackathon 2026
 * ============================================================================
 *
 * A single-file Shadow DOM Web Component providing:
 *   • Applicant registration & credential flow (5 steps)
 *   • Individual guarantor registration & dashboard
 *   • Institutional/org registration & partner dashboard
 *   • Employer credential verification
 *
 * Observed Attributes: api, lang, theme, mode
 * Custom Events: db-waas:request-created, db-waas:verification-updated,
 *   db-waas:credential-issued, db-waas:verification-completed, db-waas:error
 *
 * Design System: Midnight & Jade
 * WCAG 2.2 AA compliant
 * ============================================================================
 */

// ─── SECTION 1: i18n STRINGS (inline English, swappable) ─────────────────────

const WAAS_STRINGS = {
  en: {
    // General
    appTitle: 'Digital WaaS (ዋስ)',
    appSubtitle: 'Refugee Guarantor & Institutional Verification',
    loading: 'Loading…',
    error: 'An error occurred',
    retry: 'Retry',
    submit: 'Submit',
    next: 'Next',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    required: 'Required',
    optional: 'Optional',
    yes: 'Yes',
    no: 'No',
    download: 'Download',
    print: 'Print',
    scanQR: 'Scan QR',
    verify: 'Verify',
    search: 'Search',
    noResults: 'No results found',
    stepOf: 'Step {current} of {total}',

    // Mode labels
    modeApplicant: 'Applicant',
    modeGuarantor: 'Guarantor',
    modeEmployer: 'Employer Verification',
    modeInstitutional: 'Institutional Partner',
    modeAdmin: 'Admin',

    // Applicant Step 1 — Registration
    regTitle: 'Registration',
    regFullName: 'Full Name',
    regPhone: 'Phone Number',
    regLanguage: 'Preferred Language',
    regOriginCountry: 'Country of Origin',
    regPurpose: 'Purpose',
    regCourseRef: 'Course Reference',
    purposeEmployment: 'Employment',
    purposeTraining: 'Training',
    purposeAccommodation: 'Accommodation',
    purposeOther: 'Other',
    langEn: 'English',
    langAm: 'Amharic (አማርኛ)',
    langTi: 'Tigrinya (ትግርኛ)',
    langOm: 'Afaan Oromo',
    langSo: 'Somali (Soomaaliga)',
    langAr: 'Arabic (العربية)',

    // Applicant Step 2 — Identity Verification
    idTitle: 'Identity Verification',
    idRouteLabel: 'Select Verification Route',
    idRouteRefugee: 'Refugee ID',
    idRoutePartner: 'Partner Referral',
    idRouteNational: 'National ID',
    idUploadLabel: 'Upload Document',
    idUploadPlaceholder: 'Document upload area — drag & drop or click to select',
    idSubmitVerification: 'Submit for Verification',
    idFaydaNote: 'Fayda integration planned — requires official authorization.',
    idStatus: 'Verification Status',
    statusSubmitted: '📋 Submitted',
    statusPending: '⏳ Pending',
    statusVerified: '✅ Verified',
    statusRejected: '❌ Rejected',
    statusExpired: '⚠️ Expired',

    // Applicant Step 3 — Guarantor Selection
    guarTitle: 'Guarantor Selection',
    guarPathwayLabel: 'Select Guarantor Pathway',
    guarIndividual: 'Individual Guarantor',
    guarInstitutional: 'Institutional Guarantor',
    guarMatchedList: 'Matched Guarantors',
    guarNoMatches: 'No matching guarantors found at this time. Please try again later.',
    guarSelect: 'Select',
    guarType: 'Type',
    guarCapacity: 'Available Capacity',

    // Applicant Step 4 — Consent
    consentTitle: 'Consent & Agreement',
    consentCommitment: 'Commitment Details',
    consentParties: 'Parties Involved',
    consentScope: 'Scope of Guarantee',
    consentValidity: 'Validity Period',
    consentRevocation: 'Revocation Terms',
    consentRevocationText: 'Either party may revoke this guarantee with 30 days written notice. Revocation does not affect obligations incurred prior to revocation.',
    consentCheckbox1: 'I understand and agree to the terms and scope of this guarantee.',
    consentCheckbox2: 'I confirm that all information provided is accurate and complete.',
    consentCheckbox3: 'I consent to sharing my verification status with the guarantor and relevant institutions.',
    consentSubmit: 'Submit & Request Credential',

    // Applicant Step 5 — Credential Issued
    credTitle: 'Credential Issued',
    credWaasId: 'WaaS ID',
    credDetails: 'Credential Details',
    credType: 'Credential Type',
    credIssuer: 'Issuer',
    credIssueDate: 'Issue Date',
    credExpiryDate: 'Expiry Date',
    credScope: 'Scope',
    credGuarantor: 'Guarantor',
    credDownload: 'Download Credential',
    credPrint: 'Print Credential',
    credQR: 'Verification QR Code',
    credCongrats: 'Your WaaS credential has been issued successfully.',

    // Guarantor Flow
    guarRegTitle: 'Guarantor Registration',
    guarRegName: 'Full Name',
    guarRegPhone: 'Phone Number',
    guarRegIdStatus: 'ID Verification Status',
    guarRegReferences: 'References',
    guarRegRefPlaceholder: 'Enter references (one per line)',
    guarRegTypes: 'Guarantee Types',
    guarRegTypeEmployment: 'Employment',
    guarRegTypeTraining: 'Training',
    guarRegTypeCharacter: 'Character',
    guarRegTypeFinancial: 'Financial',
    guarRegMaxActive: 'Maximum Active Guarantees',
    guarRegConsent: 'I consent to act as a guarantor and understand my obligations.',
    guarRegSubmit: 'Register as Guarantor',
    guarDashTitle: 'Guarantor Dashboard',
    guarDashActive: 'Active Guarantees',
    guarDashPending: 'Pending Requests',
    guarDashNone: 'No guarantees to display.',

    // Institutional Flow
    orgRegTitle: 'Organization Registration',
    orgRegName: 'Organization Name',
    orgRegRef: 'Registration Reference',
    orgRegEmail: 'Contact Email',
    orgRegPhone: 'Contact Phone',
    orgRegRepName: 'Representative Name',
    orgRegAuthority: 'Authority Evidence',
    orgRegEndorsementTypes: 'Endorsement Types',
    orgRegScope: 'Scope Limitations',
    orgRegSubmit: 'Register Organization',
    orgDashTitle: 'Partner Dashboard',
    orgDashEndorsements: 'Endorsement Requests',
    orgDashNone: 'No endorsement requests.',

    // Employer Verification
    empTitle: 'Employer Verification',
    empWaasIdLabel: 'Enter WaaS ID',
    empWaasIdPlaceholder: 'e.g. WAAS-2026-XXXX',
    empVerify: 'Verify Credential',
    empScanQR: 'Scan QR Code',
    empResult: 'Verification Result',
    empValid: '✅ VALID',
    empExpired: '⚠️ EXPIRED',
    empRevoked: '❌ REVOKED',
    empInvalid: '❌ INVALID',
    empPending: '🔵 PENDING VERIFICATION',
    empCredType: 'Credential Type',
    empGuarantor: 'Guarantor / Organization',
    empIdTier: 'ID Verification Tier',
    empScope: 'Scope',
    empIssuedOn: 'Issued On',
    empExpiresOn: 'Expires On',
    empListen: 'Listen to Verification Summary',
    empStopListen: 'Stop Listening',
    empNotFound: 'No credential found with that WaaS ID.',

    // Errors
    errNetwork: 'Network error. Please check your connection and try again.',
    errServer: 'Server error. Please try again later.',
    errValidation: 'Please correct the highlighted fields.',
    errRequired: 'This field is required.',
    errPhoneFormat: 'Please enter a valid phone number.',
    errConsentRequired: 'You must agree to all terms to proceed.',
  }
};

// ─── SECTION 2: API CLIENT ───────────────────────────────────────────────────

class WaasClient {
  /**
   * @param {string} baseUrl  — API base, e.g. http://localhost:3001
   * @param {string} token    — Bearer / demo token
   */
  constructor(baseUrl = 'http://localhost:3001', token = 'waas_demo_token_2026') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  /** Internal fetch wrapper */
  async _fetch(path, opts = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Waas-Token': this.token,
      ...(opts.headers || {}),
    };
    try {
      const res = await fetch(url, { ...opts, headers });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const err = new Error(body?.error || body?.message || `HTTP ${res.status}`);
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body;
    } catch (err) {
      if (!err.status) {
        err.status = 0;
        err.message = 'Network error';
      }
      throw err;
    }
  }

  // ── Applicant ──
  createRequest(data) {
    return this._fetch('/api/v1/waas/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getRequest(requestId) {
    return this._fetch(`/api/v1/waas/request/${encodeURIComponent(requestId)}`);
  }

  // ── Identity ──
  submitIdentity(data) {
    return this._fetch('/api/v1/identity/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getIdentityStatus(verificationId) {
    return this._fetch(`/api/v1/identity/status/${encodeURIComponent(verificationId)}`);
  }

  // ── Guarantors ──
  registerGuarantor(data) {
    return this._fetch('/api/v1/guarantors/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  registerOrganization(data) {
    return this._fetch('/api/v1/organizations/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  matchGuarantors(requestId) {
    return this._fetch(`/api/v1/guarantors/match/${encodeURIComponent(requestId)}`);
  }

  // ── Credential ──
  approveRequest(requestId) {
    return this._fetch(`/api/v1/waas/${encodeURIComponent(requestId)}/approve`, {
      method: 'POST',
    });
  }

  issueCredential(requestId) {
    return this._fetch(`/api/v1/waas/${encodeURIComponent(requestId)}/issue`, {
      method: 'POST',
    });
  }

  verifyCredential(waasId) {
    return this._fetch(`/api/v1/waas/verify/${encodeURIComponent(waasId)}`);
  }

  revokeCredential(waasId, reason) {
    return this._fetch(`/api/v1/waas/revoke/${encodeURIComponent(waasId)}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

// ─── SECTION 3: STYLES ──────────────────────────────────────────────────────

const WAAS_STYLES = /* css */ `
  /* ── Reset & Host ── */
  :host {
    display: block;
    font-family: var(--bs-body-font-family, 'Inter', 'Noto Sans Ethiopic', system-ui, sans-serif);
    color: var(--bs-body-color, #172B3A);
    background: var(--waas-bg, #FAFAF7);
    line-height: 1.5;
    font-size: 16px;
    --waas-primary: var(--bs-primary, #172B3A);
    --waas-accent: #20A486;
    --waas-secondary: #E8EFF2;
    --waas-neutral: #FAFAF7;
    --waas-danger: #D64045;
    --waas-warning: #E6930A;
    --waas-info: #2E86C1;
    --waas-radius: 8px;
    --waas-gap: 16px;
    --waas-focus: 3px solid #20A486;
  }

  :host([theme="dark"]) {
    --waas-primary: #C3D5E0;
    --waas-bg: #0F1E28;
    --waas-neutral: #162430;
    --waas-secondary: #1E3042;
    color: #E8EFF2;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Typography ── */
  h1, h2, h3 {
    font-family: 'Manrope', 'Noto Sans Ethiopic', sans-serif;
    color: var(--waas-primary);
    line-height: 1.2;
  }
  h1 { font-size: 1.75rem; margin-bottom: 8px; }
  h2 { font-size: 1.375rem; margin-bottom: 8px; }
  h3 { font-size: 1.125rem; margin-bottom: 4px; }
  p  { margin-bottom: 8px; }

  /* ── Focus ── */
  *:focus-visible {
    outline: var(--waas-focus);
    outline-offset: 2px;
  }

  /* ── Links & Buttons ── */
  button, .btn {
    font-family: inherit;
    font-size: 1rem;
    min-height: 44px;
    min-width: 44px;
    padding: 10px 20px;
    border: none;
    border-radius: var(--waas-radius);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .15s, box-shadow .15s;
  }
  .btn-primary {
    background: var(--waas-accent);
    color: #fff;
  }
  .btn-primary:hover { background: #1a8d73; }
  .btn-primary:disabled {
    background: #a0c4b8;
    cursor: not-allowed;
  }
  .btn-secondary {
    background: var(--waas-secondary);
    color: var(--waas-primary);
  }
  .btn-secondary:hover { background: #d5dee3; }
  .btn-outline {
    background: transparent;
    border: 2px solid var(--waas-accent);
    color: var(--waas-accent);
  }
  .btn-outline:hover { background: rgba(32,164,134,0.08); }
  .btn-icon {
    background: none;
    border: none;
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
    color: var(--waas-primary);
  }

  /* ── Card / Panel ── */
  .card {
    background: #fff;
    border: 1px solid var(--waas-secondary);
    border-radius: var(--waas-radius);
    padding: 24px;
    margin-bottom: var(--waas-gap);
  }
  :host([theme="dark"]) .card {
    background: var(--waas-secondary);
    border-color: #2a4050;
  }

  /* ── Form ── */
  .form-group {
    margin-bottom: var(--waas-gap);
  }
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 4px;
    font-size: 0.9375rem;
  }
  .label-optional::after {
    content: ' (optional)';
    font-weight: 400;
    font-size: 0.8125rem;
    color: #6b7e8a;
  }
  input[type="text"],
  input[type="tel"],
  input[type="email"],
  input[type="number"],
  input[type="url"],
  select,
  textarea {
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border: 1.5px solid #bcc8cf;
    border-radius: var(--waas-radius);
    font-size: 1rem;
    font-family: inherit;
    color: inherit;
    background: #fff;
    transition: border-color .15s;
  }
  :host([theme="dark"]) input,
  :host([theme="dark"]) select,
  :host([theme="dark"]) textarea {
    background: var(--waas-neutral);
    border-color: #3a5060;
    color: #E8EFF2;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--waas-accent);
    outline: var(--waas-focus);
    outline-offset: 2px;
  }
  input[aria-invalid="true"],
  select[aria-invalid="true"],
  textarea[aria-invalid="true"] {
    border-color: var(--waas-danger);
  }
  .error-msg {
    color: var(--waas-danger);
    font-size: 0.8125rem;
    margin-top: 4px;
  }
  textarea { min-height: 88px; resize: vertical; }

  /* ── Checkbox ── */
  .checkbox-group {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .checkbox-group input[type="checkbox"] {
    width: 22px;
    height: 22px;
    min-width: 22px;
    accent-color: var(--waas-accent);
    margin-top: 2px;
    cursor: pointer;
  }
  .checkbox-group label {
    font-weight: 400;
    margin-bottom: 0;
    cursor: pointer;
  }

  /* ── Radio buttons ── */
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .radio-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 1.5px solid var(--waas-secondary);
    border-radius: var(--waas-radius);
    cursor: pointer;
    min-height: 44px;
    transition: border-color .15s, background .15s;
  }
  .radio-option:hover,
  .radio-option:focus-within {
    border-color: var(--waas-accent);
    background: rgba(32,164,134,0.04);
  }
  .radio-option input[type="radio"] {
    width: 20px;
    height: 20px;
    accent-color: var(--waas-accent);
  }

  /* ── Status badges ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge-submitted  { background: #E8EFF2; color: #172B3A; }
  .badge-pending    { background: #FFF3CD; color: #856404; }
  .badge-verified   { background: #D4EDDA; color: #155724; }
  .badge-rejected   { background: #F8D7DA; color: #721C24; }
  .badge-expired    { background: #FFE0B2; color: #7A4F01; }
  .badge-valid      { background: #D4EDDA; color: #155724; }
  .badge-revoked    { background: #F8D7DA; color: #721C24; }
  .badge-invalid    { background: #F8D7DA; color: #721C24; }
  .badge-pending_verification { background: #D6EAF8; color: #1B4F72; }

  /* ── Stepper ── */
  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 24px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .step-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #6b7e8a;
  }
  .step-indicator.active { color: var(--waas-accent); }
  .step-indicator.completed { color: var(--waas-primary); }
  .step-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 700;
    border: 2px solid #bcc8cf;
    background: #fff;
    flex-shrink: 0;
  }
  .step-indicator.active .step-circle {
    border-color: var(--waas-accent);
    background: var(--waas-accent);
    color: #fff;
  }
  .step-indicator.completed .step-circle {
    border-color: var(--waas-primary);
    background: var(--waas-primary);
    color: #fff;
  }
  .step-line {
    flex: 1;
    height: 2px;
    background: #bcc8cf;
    min-width: 24px;
    margin: 0 4px;
  }
  .step-line.completed { background: var(--waas-primary); }

  /* ── Verification result ── */
  .verification-result {
    text-align: center;
    padding: 32px 24px;
  }
  .verification-status-icon {
    font-size: 3rem;
    margin-bottom: 12px;
  }
  .verification-status-text {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .status-VALID  { color: #155724; }
  .status-EXPIRED { color: var(--waas-warning); }
  .status-REVOKED { color: var(--waas-danger); }
  .status-INVALID { color: var(--waas-danger); }
  .status-PENDING_VERIFICATION { color: var(--waas-info); }

  .detail-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    text-align: left;
    max-width: 480px;
    margin: 16px auto 0;
  }
  .detail-label {
    font-weight: 600;
    color: #6b7e8a;
  }
  .detail-value {
    font-weight: 400;
  }

  /* ── Upload area ── */
  .upload-area {
    border: 2px dashed #bcc8cf;
    border-radius: var(--waas-radius);
    padding: 32px;
    text-align: center;
    color: #6b7e8a;
    cursor: pointer;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color .15s;
  }
  .upload-area:hover, .upload-area:focus-within {
    border-color: var(--waas-accent);
  }

  /* ── Guarantor match card ── */
  .match-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1.5px solid var(--waas-secondary);
    border-radius: var(--waas-radius);
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .match-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .match-name { font-weight: 600; }
  .match-meta { font-size: 0.8125rem; color: #6b7e8a; }

  /* ── QR / Credential ── */
  .credential-card {
    text-align: center;
    padding: 24px;
  }
  .credential-card img {
    max-width: 200px;
    margin: 16px auto;
    display: block;
    border: 8px solid #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    border-radius: 8px;
  }

  /* ── Nav / Mode selector ── */
  .mode-nav {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .mode-btn {
    padding: 10px 16px;
    border: 1.5px solid var(--waas-secondary);
    border-radius: var(--waas-radius);
    background: #fff;
    color: var(--waas-primary);
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    transition: all .15s;
    font-family: inherit;
    font-size: 0.9375rem;
  }
  .mode-btn[aria-pressed="true"],
  .mode-btn.active {
    background: var(--waas-accent);
    color: #fff;
    border-color: var(--waas-accent);
  }
  .mode-btn:hover:not([aria-pressed="true"]) {
    border-color: var(--waas-accent);
  }

  /* ── Info note ── */
  .info-note {
    background: #D6EAF8;
    color: #1B4F72;
    padding: 12px 16px;
    border-radius: var(--waas-radius);
    font-size: 0.875rem;
    margin-bottom: var(--waas-gap);
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .info-note::before { content: 'ℹ️'; flex-shrink: 0; }

  /* ── Table ── */
  .waas-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--waas-gap);
  }
  .waas-table th, .waas-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--waas-secondary);
    font-size: 0.9375rem;
  }
  .waas-table th {
    font-weight: 600;
    background: var(--waas-secondary);
    position: sticky;
    top: 0;
  }

  /* ── Live region ── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }

  /* ── Layout ── */
  .waas-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: var(--waas-gap);
  }
  .actions-end {
    justify-content: flex-end;
  }

  /* ── Responsive / mobile 320px reflow ── */
  @media (max-width: 480px) {
    .waas-container { padding: 16px 8px; }
    h1 { font-size: 1.375rem; }
    .card { padding: 16px; }
    .detail-grid { grid-template-columns: 1fr; }
    .stepper { gap: 0; }
    .step-label { display: none; }
  }

  /* ── RTL ── */
  :host([dir="rtl"]) .stepper { direction: rtl; }
  :host([dir="rtl"]) .actions { flex-direction: row-reverse; }
  :host([dir="rtl"]) .checkbox-group,
  :host([dir="rtl"]) .radio-option { flex-direction: row-reverse; }

  /* ── Print ── */
  @media print {
    .mode-nav, .actions, button { display: none !important; }
    .card { border: 1px solid #ccc; box-shadow: none; }
  }
`;

// ─── SECTION 4: COMPONENT CLASS ──────────────────────────────────────────────

class DbWaas extends HTMLElement {

  // ── 4a. Observed attributes ──
  static get observedAttributes() {
    return ['api', 'lang', 'theme', 'mode'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this._mode = 'applicant';          // applicant | guarantor | employer | admin
    this._lang = 'en';
    this._theme = 'light';
    this._apiBase = 'http://localhost:3001';
    this._client = new WaasClient(this._apiBase);

    // Applicant flow state
    this._applicantStep = 1;
    this._applicantData = {};
    this._verificationId = null;
    this._verificationStatus = null;
    this._requestId = null;
    this._selectedGuarantor = null;
    this._matchedGuarantors = [];
    this._credential = null;

    // Guarantor flow state
    this._guarantorView = 'register'; // register | dashboard
    this._guarantorData = {};
    this._guarantorDashData = [];

    // Institutional flow state
    this._orgView = 'register';       // register | dashboard
    this._orgData = {};
    this._orgDashData = [];

    // Employer flow state
    this._verifyResult = null;

    // Error
    this._error = null;
    this._loading = false;

    // Speech
    this._speaking = false;
  }

  // ── 4b. Lifecycle ──
  connectedCallback() {
    this._updateDirection();
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (name) {
      case 'api':
        this._apiBase = newVal || 'http://localhost:3001';
        this._client = new WaasClient(this._apiBase);
        break;
      case 'lang':
        this._lang = newVal || 'en';
        this._updateDirection();
        break;
      case 'theme':
        this._theme = newVal || 'light';
        break;
      case 'mode':
        if (['applicant', 'guarantor', 'employer', 'admin'].includes(newVal)) {
          this._mode = newVal;
        }
        break;
    }
    this._render();
  }

  disconnectedCallback() {
    this._stopSpeech();
  }

  // ── 4c. i18n helper ──
  t(key) {
    const strings = WAAS_STRINGS[this._lang] || WAAS_STRINGS.en;
    return strings[key] ?? WAAS_STRINGS.en[key] ?? key;
  }

  // ── 4d. Direction (RTL for Arabic) ──
  _updateDirection() {
    const dir = this._lang === 'ar' ? 'rtl' : 'ltr';
    this.setAttribute('dir', dir);
  }

  // ── 4e. Custom event dispatcher ──
  _emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  _emitError(error) {
    this._emit('db-waas:error', { error: error?.message || error });
  }

  // ── 4f. Speech Synthesis ──
  _speak(text) {
    if (!('speechSynthesis' in window)) return;
    this._stopSpeech();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this._lang === 'am' ? 'am-ET' : this._lang === 'ar' ? 'ar' : 'en-US';
    utter.onend = () => { this._speaking = false; this._render(); };
    speechSynthesis.speak(utter);
    this._speaking = true;
    this._render();
  }

  _stopSpeech() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this._speaking = false;
  }

  // ── 4g. Render orchestrator ──
  _render() {
    const root = this.shadowRoot;
    root.innerHTML = '';

    // Style
    const style = document.createElement('style');
    style.textContent = WAAS_STYLES;
    root.appendChild(style);

    // Live region for announcements
    const live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('role', 'status');
    live.className = 'sr-only';
    live.id = 'waas-live';
    root.appendChild(live);
    this._liveRegion = live;

    // Container
    const container = document.createElement('div');
    container.className = 'waas-container';
    container.setAttribute('role', 'main');

    // Title
    const title = document.createElement('h1');
    title.textContent = this.t('appTitle');
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = this.t('appSubtitle');
    subtitle.style.color = '#6b7e8a';
    subtitle.style.marginBottom = '24px';
    container.appendChild(subtitle);

    // Mode nav (unless set via attribute)
    if (!this.hasAttribute('mode')) {
      container.appendChild(this._renderModeNav());
    }

    // Error banner
    if (this._error) {
      container.appendChild(this._renderError());
    }

    // Loading overlay
    if (this._loading) {
      const ld = document.createElement('p');
      ld.setAttribute('role', 'alert');
      ld.textContent = this.t('loading');
      ld.style.textAlign = 'center';
      ld.style.padding = '24px';
      container.appendChild(ld);
      root.appendChild(container);
      return;
    }

    // Route to mode view
    switch (this._mode) {
      case 'applicant':
        container.appendChild(this._renderApplicantFlow());
        break;
      case 'guarantor':
        container.appendChild(this._renderGuarantorFlow());
        break;
      case 'employer':
        container.appendChild(this._renderEmployerFlow());
        break;
      case 'admin':
        container.appendChild(this._renderInstitutionalFlow());
        break;
    }

    root.appendChild(container);
  }

  // ── 4h. Mode nav ──
  _renderModeNav() {
    const nav = document.createElement('nav');
    nav.className = 'mode-nav';
    nav.setAttribute('aria-label', 'Select mode');

    const modes = [
      { key: 'applicant', label: this.t('modeApplicant') },
      { key: 'guarantor', label: this.t('modeGuarantor') },
      { key: 'employer', label: this.t('modeEmployer') },
      { key: 'admin', label: this.t('modeInstitutional') },
    ];

    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.type = 'button';
      btn.textContent = m.label;
      btn.setAttribute('aria-pressed', this._mode === m.key ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this._mode = m.key;
        this._error = null;
        this._announce(`${m.label} mode selected`);
        this._render();
      });
      nav.appendChild(btn);
    });
    return nav;
  }

  // ── 4i. Error banner ──
  _renderError() {
    const div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('role', 'alert');
    div.style.borderColor = 'var(--waas-danger)';
    div.style.background = '#FFF5F5';
    div.innerHTML = `<p style="color:var(--waas-danger);font-weight:600;">⚠️ ${this._escHtml(this._error)}</p>`;

    const btn = document.createElement('button');
    btn.className = 'btn-outline';
    btn.type = 'button';
    btn.textContent = this.t('retry');
    btn.addEventListener('click', () => { this._error = null; this._render(); });
    div.appendChild(btn);
    return div;
  }

  _escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  _announce(msg) {
    if (this._liveRegion) {
      this._liveRegion.textContent = '';
      requestAnimationFrame(() => { this._liveRegion.textContent = msg; });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  APPLICANT FLOW (5 steps)
  // ═══════════════════════════════════════════════════════════════════════════

  _renderApplicantFlow() {
    const wrap = document.createElement('div');

    // Stepper
    wrap.appendChild(this._renderStepper(5, this._applicantStep));

    // Step content
    switch (this._applicantStep) {
      case 1: wrap.appendChild(this._renderApplicantStep1()); break;
      case 2: wrap.appendChild(this._renderApplicantStep2()); break;
      case 3: wrap.appendChild(this._renderApplicantStep3()); break;
      case 4: wrap.appendChild(this._renderApplicantStep4()); break;
      case 5: wrap.appendChild(this._renderApplicantStep5()); break;
    }
    return wrap;
  }

  _renderStepper(total, current) {
    const nav = document.createElement('nav');
    nav.className = 'stepper';
    nav.setAttribute('aria-label', this.t('stepOf').replace('{current}', current).replace('{total}', total));

    for (let i = 1; i <= total; i++) {
      if (i > 1) {
        const line = document.createElement('div');
        line.className = 'step-line' + (i <= current ? ' completed' : '');
        nav.appendChild(line);
      }
      const ind = document.createElement('div');
      ind.className = 'step-indicator' + (i === current ? ' active' : i < current ? ' completed' : '');
      ind.setAttribute('aria-current', i === current ? 'step' : 'false');

      const circle = document.createElement('span');
      circle.className = 'step-circle';
      circle.textContent = i < current ? '✓' : i;
      ind.appendChild(circle);

      const lbl = document.createElement('span');
      lbl.className = 'step-label';
      lbl.textContent = [
        this.t('regTitle'),
        this.t('idTitle'),
        this.t('guarTitle'),
        this.t('consentTitle'),
        this.t('credTitle'),
      ][i - 1] || '';
      ind.appendChild(lbl);

      nav.appendChild(ind);
    }
    return nav;
  }

  // ── Step 1: Registration ──
  _renderApplicantStep1() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('regTitle');
    card.appendChild(h2);

    const form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this._validateForm(form)) {
        this._applicantData.full_name = form.querySelector('#waas-reg-name').value.trim();
        this._applicantData.phone = form.querySelector('#waas-reg-phone').value.trim();
        this._applicantData.lang = form.querySelector('#waas-reg-lang').value;
        this._applicantData.origin_country = form.querySelector('#waas-reg-country').value.trim();
        this._applicantData.purpose = form.querySelector('#waas-reg-purpose').value;
        this._applicantData.course_ref = form.querySelector('#waas-reg-course').value.trim();
        this._applicantStep = 2;
        this._announce(this.t('idTitle'));
        this._render();
      }
    });

    // Full Name
    form.appendChild(this._field('text', 'waas-reg-name', this.t('regFullName'), {
      required: true, value: this._applicantData.full_name || '',
    }));

    // Phone
    form.appendChild(this._field('tel', 'waas-reg-phone', this.t('regPhone'), {
      required: true, value: this._applicantData.phone || '', pattern: '[+0-9\\s\\-()]+',
    }));

    // Language
    form.appendChild(this._select('waas-reg-lang', this.t('regLanguage'), [
      { v: 'en', l: this.t('langEn') },
      { v: 'am', l: this.t('langAm') },
      { v: 'ti', l: this.t('langTi') },
      { v: 'om', l: this.t('langOm') },
      { v: 'so', l: this.t('langSo') },
      { v: 'ar', l: this.t('langAr') },
    ], { required: true, value: this._applicantData.lang || this._lang }));

    // Country (optional)
    form.appendChild(this._field('text', 'waas-reg-country', this.t('regOriginCountry'), {
      optional: true, value: this._applicantData.origin_country || '',
    }));

    // Purpose
    form.appendChild(this._select('waas-reg-purpose', this.t('regPurpose'), [
      { v: 'employment', l: this.t('purposeEmployment') },
      { v: 'training', l: this.t('purposeTraining') },
      { v: 'accommodation', l: this.t('purposeAccommodation') },
      { v: 'other', l: this.t('purposeOther') },
    ], { required: true, value: this._applicantData.purpose || '' }));

    // Course ref (optional)
    form.appendChild(this._field('text', 'waas-reg-course', this.t('regCourseRef'), {
      optional: true, value: this._applicantData.course_ref || '',
    }));

    // Submit
    const actions = document.createElement('div');
    actions.className = 'actions actions-end';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.type = 'submit';
    btn.textContent = this.t('next');
    actions.appendChild(btn);
    form.appendChild(actions);

    card.appendChild(form);
    return card;
  }

  // ── Step 2: Identity Verification ──
  _renderApplicantStep2() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('idTitle');
    card.appendChild(h2);

    // Route selector
    const routeLabel = document.createElement('h3');
    routeLabel.textContent = this.t('idRouteLabel');
    card.appendChild(routeLabel);

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    radioGroup.setAttribute('role', 'radiogroup');
    radioGroup.setAttribute('aria-label', this.t('idRouteLabel'));

    const routes = [
      { v: 'refugee_id', l: this.t('idRouteRefugee'), icon: '🪪' },
      { v: 'partner_referral', l: this.t('idRoutePartner'), icon: '🤝' },
      { v: 'national_id', l: this.t('idRouteNational'), icon: '🆔' },
    ];

    routes.forEach(r => {
      const opt = document.createElement('label');
      opt.className = 'radio-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'id-route';
      radio.value = r.v;
      radio.checked = this._applicantData.id_route === r.v;
      radio.addEventListener('change', () => {
        this._applicantData.id_route = r.v;
      });
      opt.appendChild(radio);
      const span = document.createElement('span');
      span.textContent = `${r.icon} ${r.l}`;
      opt.appendChild(span);
      radioGroup.appendChild(opt);
    });
    card.appendChild(radioGroup);

    // Upload placeholder
    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = this.t('idUploadLabel');
    uploadLabel.setAttribute('for', 'waas-id-upload');
    uploadLabel.style.marginTop = '16px';
    card.appendChild(uploadLabel);

    const upload = document.createElement('div');
    upload.className = 'upload-area';
    upload.id = 'waas-id-upload';
    upload.setAttribute('role', 'button');
    upload.setAttribute('tabindex', '0');
    upload.setAttribute('aria-label', this.t('idUploadPlaceholder'));
    upload.textContent = this.t('idUploadPlaceholder');
    card.appendChild(upload);

    // Status badges
    if (this._verificationStatus) {
      const statusH3 = document.createElement('h3');
      statusH3.textContent = this.t('idStatus');
      statusH3.style.marginTop = '16px';
      card.appendChild(statusH3);

      const badge = document.createElement('span');
      const statusKey = 'status' + this._verificationStatus.charAt(0).toUpperCase() + this._verificationStatus.slice(1);
      badge.className = `badge badge-${this._verificationStatus}`;
      badge.textContent = this.t(statusKey);
      card.appendChild(badge);
    }

    // Status badge demo strip
    const demoH3 = document.createElement('h3');
    demoH3.textContent = this.t('idStatus');
    demoH3.style.marginTop = '16px';
    card.appendChild(demoH3);

    const badgeStrip = document.createElement('div');
    badgeStrip.style.display = 'flex';
    badgeStrip.style.gap = '8px';
    badgeStrip.style.flexWrap = 'wrap';
    badgeStrip.style.marginBottom = '16px';
    ['submitted', 'pending', 'verified', 'rejected', 'expired'].forEach(s => {
      const b = document.createElement('span');
      const sk = 'status' + s.charAt(0).toUpperCase() + s.slice(1);
      b.className = `badge badge-${s}`;
      b.textContent = this.t(sk);
      badgeStrip.appendChild(b);
    });
    card.appendChild(badgeStrip);

    // Fayda note
    const note = document.createElement('div');
    note.className = 'info-note';
    note.textContent = this.t('idFaydaNote');
    card.appendChild(note);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.type = 'button';
    backBtn.textContent = this.t('back');
    backBtn.addEventListener('click', () => {
      this._applicantStep = 1;
      this._announce(this.t('regTitle'));
      this._render();
    });
    actions.appendChild(backBtn);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary';
    submitBtn.type = 'button';
    submitBtn.textContent = this.t('idSubmitVerification');
    submitBtn.addEventListener('click', () => this._submitIdentity());
    actions.appendChild(submitBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-outline';
    nextBtn.type = 'button';
    nextBtn.textContent = this.t('next');
    nextBtn.addEventListener('click', () => {
      this._applicantStep = 3;
      this._announce(this.t('guarTitle'));
      this._render();
    });
    actions.appendChild(nextBtn);

    card.appendChild(actions);
    return card;
  }

  async _submitIdentity() {
    if (!this._applicantData.id_route) {
      this._error = this.t('errRequired');
      this._render();
      return;
    }
    this._loading = true;
    this._render();
    try {
      const res = await this._client.submitIdentity({
        applicant_id: this._requestId,
        route: this._applicantData.id_route,
        document_ref: 'placeholder',
      });
      this._verificationId = res.verificationId || res.id;
      this._verificationStatus = res.status || 'submitted';
      this._emit('db-waas:verification-updated', { verificationId: this._verificationId, status: this._verificationStatus });
      this._error = null;
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  // ── Step 3: Guarantor Selection ──
  _renderApplicantStep3() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('guarTitle');
    card.appendChild(h2);

    // Pathway selection
    const pathLabel = document.createElement('h3');
    pathLabel.textContent = this.t('guarPathwayLabel');
    card.appendChild(pathLabel);

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    radioGroup.setAttribute('role', 'radiogroup');
    radioGroup.setAttribute('aria-label', this.t('guarPathwayLabel'));

    [
      { v: 'individual', l: this.t('guarIndividual'), icon: '👤' },
      { v: 'institutional', l: this.t('guarInstitutional'), icon: '🏛️' },
    ].forEach(r => {
      const opt = document.createElement('label');
      opt.className = 'radio-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'guar-pathway';
      radio.value = r.v;
      radio.checked = this._applicantData.guarantor_type === r.v;
      radio.addEventListener('change', () => {
        this._applicantData.guarantor_type = r.v;
      });
      opt.appendChild(radio);
      const span = document.createElement('span');
      span.textContent = `${r.icon} ${r.l}`;
      opt.appendChild(span);
      radioGroup.appendChild(opt);
    });
    card.appendChild(radioGroup);

    // Search / Match button
    const matchBtn = document.createElement('button');
    matchBtn.className = 'btn-outline';
    matchBtn.type = 'button';
    matchBtn.textContent = this.t('search');
    matchBtn.style.marginTop = '12px';
    matchBtn.addEventListener('click', () => this._loadMatchedGuarantors());
    card.appendChild(matchBtn);

    // Matched list
    const listH3 = document.createElement('h3');
    listH3.textContent = this.t('guarMatchedList');
    listH3.style.marginTop = '16px';
    card.appendChild(listH3);

    if (this._matchedGuarantors.length === 0) {
      const none = document.createElement('p');
      none.textContent = this.t('guarNoMatches');
      none.style.color = '#6b7e8a';
      card.appendChild(none);
    } else {
      this._matchedGuarantors.forEach(g => {
        const mc = document.createElement('div');
        mc.className = 'match-card';

        const info = document.createElement('div');
        info.className = 'match-info';
        const name = document.createElement('span');
        name.className = 'match-name';
        name.textContent = g.full_name || g.org_name || g.name || 'Guarantor';
        info.appendChild(name);
        const meta = document.createElement('span');
        meta.className = 'match-meta';
        meta.textContent = `${this.t('guarType')}: ${g.type || 'individual'} · ${this.t('guarCapacity')}: ${g.available_capacity ?? 'N/A'}`;
        info.appendChild(meta);
        mc.appendChild(info);

        const selBtn = document.createElement('button');
        selBtn.className = 'btn-primary';
        selBtn.type = 'button';
        selBtn.textContent = this.t('guarSelect');
        selBtn.addEventListener('click', () => {
          this._selectedGuarantor = g;
          this._applicantStep = 4;
          this._announce(this.t('consentTitle'));
          this._render();
        });
        mc.appendChild(selBtn);
        card.appendChild(mc);
      });
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.type = 'button';
    backBtn.textContent = this.t('back');
    backBtn.addEventListener('click', () => {
      this._applicantStep = 2;
      this._announce(this.t('idTitle'));
      this._render();
    });
    actions.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    nextBtn.type = 'button';
    nextBtn.textContent = this.t('next');
    nextBtn.disabled = !this._selectedGuarantor;
    nextBtn.addEventListener('click', () => {
      if (this._selectedGuarantor) {
        this._applicantStep = 4;
        this._announce(this.t('consentTitle'));
        this._render();
      }
    });
    actions.appendChild(nextBtn);

    card.appendChild(actions);
    return card;
  }

  async _loadMatchedGuarantors() {
    if (!this._requestId) {
      // Create request first if not yet created
      await this._createRequest();
    }
    this._loading = true;
    this._render();
    try {
      const res = await this._client.matchGuarantors(this._requestId);
      this._matchedGuarantors = res.guarantors || res.matches || res || [];
      if (!Array.isArray(this._matchedGuarantors)) this._matchedGuarantors = [];
      this._error = null;
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
      this._matchedGuarantors = [];
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _createRequest() {
    try {
      const res = await this._client.createRequest(this._applicantData);
      this._requestId = res.requestId || res.id;
      this._emit('db-waas:request-created', { requestId: this._requestId });
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
    }
  }

  // ── Step 4: Consent ──
  _renderApplicantStep4() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('consentTitle');
    card.appendChild(h2);

    // Commitment details
    const details = [
      { label: this.t('consentParties'), value: `${this._applicantData.full_name || 'Applicant'} ↔ ${this._selectedGuarantor?.full_name || this._selectedGuarantor?.org_name || 'Guarantor'}` },
      { label: this.t('consentScope'), value: this._applicantData.purpose || 'General' },
      { label: this.t('consentValidity'), value: '12 months from issue date' },
    ];

    const grid = document.createElement('div');
    grid.className = 'detail-grid';
    details.forEach(d => {
      const lbl = document.createElement('span');
      lbl.className = 'detail-label';
      lbl.textContent = d.label;
      grid.appendChild(lbl);
      const val = document.createElement('span');
      val.className = 'detail-value';
      val.textContent = d.value;
      grid.appendChild(val);
    });
    card.appendChild(grid);

    // Revocation terms
    const revH3 = document.createElement('h3');
    revH3.textContent = this.t('consentRevocation');
    revH3.style.marginTop = '16px';
    card.appendChild(revH3);
    const revP = document.createElement('p');
    revP.textContent = this.t('consentRevocationText');
    revP.style.fontSize = '0.9375rem';
    card.appendChild(revP);

    // Checkboxes
    const form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.style.marginTop = '16px';

    const checks = [
      { id: 'consent1', label: this.t('consentCheckbox1') },
      { id: 'consent2', label: this.t('consentCheckbox2') },
      { id: 'consent3', label: this.t('consentCheckbox3') },
    ];

    checks.forEach(c => {
      const g = document.createElement('div');
      g.className = 'checkbox-group';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `waas-${c.id}`;
      cb.required = true;
      g.appendChild(cb);
      const lbl = document.createElement('label');
      lbl.setAttribute('for', `waas-${c.id}`);
      lbl.textContent = c.label;
      g.appendChild(lbl);
      form.appendChild(g);
    });

    // Error for consent
    const errDiv = document.createElement('div');
    errDiv.id = 'waas-consent-error';
    errDiv.className = 'error-msg';
    errDiv.setAttribute('role', 'alert');
    errDiv.setAttribute('aria-live', 'assertive');
    form.appendChild(errDiv);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.type = 'button';
    backBtn.textContent = this.t('back');
    backBtn.addEventListener('click', () => {
      this._applicantStep = 3;
      this._announce(this.t('guarTitle'));
      this._render();
    });
    actions.appendChild(backBtn);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary';
    submitBtn.type = 'button';
    submitBtn.textContent = this.t('consentSubmit');
    submitBtn.addEventListener('click', () => {
      const allChecked = checks.every(c => form.querySelector(`#waas-${c.id}`).checked);
      if (!allChecked) {
        errDiv.textContent = this.t('errConsentRequired');
        return;
      }
      errDiv.textContent = '';
      this._submitConsent();
    });
    actions.appendChild(submitBtn);
    form.appendChild(actions);

    card.appendChild(form);
    return card;
  }

  async _submitConsent() {
    this._loading = true;
    this._render();
    try {
      // Create the request if not done yet
      if (!this._requestId) {
        await this._createRequest();
      }
      // Approve
      await this._client.approveRequest(this._requestId);
      // Issue
      const res = await this._client.issueCredential(this._requestId);
      this._credential = res.credential || res;
      this._emit('db-waas:credential-issued', { credential: this._credential });
      this._applicantStep = 5;
      this._announce(this.t('credTitle'));
      this._error = null;
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  // ── Step 5: Credential Issued ──
  _renderApplicantStep5() {
    const card = document.createElement('div');
    card.className = 'card credential-card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('credTitle');
    card.appendChild(h2);

    const congrats = document.createElement('p');
    congrats.textContent = this.t('credCongrats');
    congrats.style.color = 'var(--waas-accent)';
    congrats.style.fontWeight = '600';
    congrats.style.fontSize = '1.125rem';
    card.appendChild(congrats);

    const cred = this._credential || {};

    // WaaS ID
    const idP = document.createElement('p');
    idP.style.fontSize = '1.5rem';
    idP.style.fontWeight = '700';
    idP.style.marginTop = '16px';
    idP.innerHTML = `${this._escHtml(this.t('credWaasId'))}: <span style="color:var(--waas-accent)">${this._escHtml(cred.waas_id_public || cred.waasId || 'N/A')}</span>`;
    card.appendChild(idP);

    // QR
    if (cred.qr_path || cred.qrUrl) {
      const qrLabel = document.createElement('p');
      qrLabel.textContent = this.t('credQR');
      qrLabel.style.fontWeight = '600';
      qrLabel.style.marginTop = '16px';
      card.appendChild(qrLabel);

      const qrImg = document.createElement('img');
      const qrSrc = cred.qr_path || cred.qrUrl;
      qrImg.src = qrSrc.startsWith('http') ? qrSrc : `${this._apiBase}/${qrSrc.replace(/^\/+/, '')}`;
      qrImg.alt = `QR Code for ${cred.waas_id_public || 'WaaS Credential'}`;
      qrImg.width = 200;
      qrImg.height = 200;
      card.appendChild(qrImg);
    }

    // Detail grid
    const detailH3 = document.createElement('h3');
    detailH3.textContent = this.t('credDetails');
    detailH3.style.marginTop = '16px';
    card.appendChild(detailH3);

    const grid = document.createElement('div');
    grid.className = 'detail-grid';
    const credDetails = [
      { label: this.t('credType'), value: cred.credential_type || cred.type || 'WaaS Guarantee' },
      { label: this.t('credIssuer'), value: cred.issuer || 'Digital WaaS System' },
      { label: this.t('credGuarantor'), value: cred.guarantor_ref || this._selectedGuarantor?.full_name || this._selectedGuarantor?.org_name || 'N/A' },
      { label: this.t('credScope'), value: cred.scope || this._applicantData.purpose || 'General' },
      { label: this.t('credIssueDate'), value: cred.issue_date || new Date().toISOString().slice(0, 10) },
      { label: this.t('credExpiryDate'), value: cred.expiry_date || 'N/A' },
    ];
    credDetails.forEach(d => {
      const lbl = document.createElement('span');
      lbl.className = 'detail-label';
      lbl.textContent = d.label;
      grid.appendChild(lbl);
      const val = document.createElement('span');
      val.className = 'detail-value';
      val.textContent = d.value;
      grid.appendChild(val);
    });
    card.appendChild(grid);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.style.justifyContent = 'center';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn-primary';
    dlBtn.type = 'button';
    dlBtn.textContent = `📥 ${this.t('credDownload')}`;
    dlBtn.addEventListener('click', () => {
      // Download credential as JSON
      const blob = new Blob([JSON.stringify(cred, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waas-credential-${cred.waas_id_public || 'credential'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    actions.appendChild(dlBtn);

    const printBtn = document.createElement('button');
    printBtn.className = 'btn-outline';
    printBtn.type = 'button';
    printBtn.textContent = `🖨️ ${this.t('credPrint')}`;
    printBtn.addEventListener('click', () => window.print());
    actions.appendChild(printBtn);

    card.appendChild(actions);
    return card;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  GUARANTOR FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  _renderGuarantorFlow() {
    const wrap = document.createElement('div');

    // Sub-nav
    const nav = document.createElement('div');
    nav.className = 'mode-nav';
    [
      { key: 'register', label: this.t('guarRegTitle') },
      { key: 'dashboard', label: this.t('guarDashTitle') },
    ].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.type = 'button';
      btn.textContent = m.label;
      btn.setAttribute('aria-pressed', this._guarantorView === m.key ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this._guarantorView = m.key;
        if (m.key === 'dashboard') this._loadGuarantorDashboard();
        else this._render();
      });
      nav.appendChild(btn);
    });
    wrap.appendChild(nav);

    if (this._guarantorView === 'register') {
      wrap.appendChild(this._renderGuarantorRegForm());
    } else {
      wrap.appendChild(this._renderGuarantorDashboard());
    }
    return wrap;
  }

  _renderGuarantorRegForm() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('guarRegTitle');
    card.appendChild(h2);

    const form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this._validateForm(form)) {
        this._registerGuarantor(form);
      }
    });

    // Name
    form.appendChild(this._field('text', 'waas-guar-name', this.t('guarRegName'), { required: true }));

    // Phone
    form.appendChild(this._field('tel', 'waas-guar-phone', this.t('guarRegPhone'), { required: true }));

    // ID Status
    form.appendChild(this._select('waas-guar-idstatus', this.t('guarRegIdStatus'), [
      { v: 'verified', l: this.t('statusVerified') },
      { v: 'pending', l: this.t('statusPending') },
      { v: 'submitted', l: this.t('statusSubmitted') },
    ], { required: true }));

    // References
    const refGroup = document.createElement('div');
    refGroup.className = 'form-group';
    const refLabel = document.createElement('label');
    refLabel.setAttribute('for', 'waas-guar-refs');
    refLabel.textContent = this.t('guarRegReferences');
    refGroup.appendChild(refLabel);
    const refTextarea = document.createElement('textarea');
    refTextarea.id = 'waas-guar-refs';
    refTextarea.placeholder = this.t('guarRegRefPlaceholder');
    refTextarea.rows = 3;
    refGroup.appendChild(refTextarea);
    form.appendChild(refGroup);

    // Guarantee Types (checkboxes)
    const typesH3 = document.createElement('h3');
    typesH3.textContent = this.t('guarRegTypes');
    form.appendChild(typesH3);

    ['Employment', 'Training', 'Character', 'Financial'].forEach(t => {
      const g = document.createElement('div');
      g.className = 'checkbox-group';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `waas-guar-type-${t.toLowerCase()}`;
      cb.value = t.toLowerCase();
      g.appendChild(cb);
      const lbl = document.createElement('label');
      lbl.setAttribute('for', `waas-guar-type-${t.toLowerCase()}`);
      lbl.textContent = this.t(`guarRegType${t}`);
      g.appendChild(lbl);
      form.appendChild(g);
    });

    // Max Active
    form.appendChild(this._field('number', 'waas-guar-max', this.t('guarRegMaxActive'), { required: true, min: '1', max: '20', value: '5' }));

    // Consent
    const consentG = document.createElement('div');
    consentG.className = 'checkbox-group';
    consentG.style.marginTop = '16px';
    const consentCb = document.createElement('input');
    consentCb.type = 'checkbox';
    consentCb.id = 'waas-guar-consent';
    consentCb.required = true;
    consentG.appendChild(consentCb);
    const consentLbl = document.createElement('label');
    consentLbl.setAttribute('for', 'waas-guar-consent');
    consentLbl.textContent = this.t('guarRegConsent');
    consentG.appendChild(consentLbl);
    form.appendChild(consentG);

    // Error area
    const errDiv = document.createElement('div');
    errDiv.id = 'waas-guar-error';
    errDiv.className = 'error-msg';
    errDiv.setAttribute('role', 'alert');
    form.appendChild(errDiv);

    // Submit
    const actions = document.createElement('div');
    actions.className = 'actions actions-end';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.type = 'submit';
    btn.textContent = this.t('guarRegSubmit');
    actions.appendChild(btn);
    form.appendChild(actions);

    card.appendChild(form);
    return card;
  }

  async _registerGuarantor(form) {
    const consent = form.querySelector('#waas-guar-consent');
    const errDiv = form.querySelector('#waas-guar-error');
    if (!consent.checked) {
      errDiv.textContent = this.t('errConsentRequired');
      return;
    }
    errDiv.textContent = '';

    const types = [];
    form.querySelectorAll('[id^="waas-guar-type-"]').forEach(cb => {
      if (cb.checked) types.push(cb.value);
    });

    const data = {
      full_name: form.querySelector('#waas-guar-name').value.trim(),
      phone: form.querySelector('#waas-guar-phone').value.trim(),
      id_status: form.querySelector('#waas-guar-idstatus').value,
      references: form.querySelector('#waas-guar-refs').value.trim(),
      guarantee_types: types,
      max_active: parseInt(form.querySelector('#waas-guar-max').value, 10),
      consent_given: true,
    };

    this._loading = true;
    this._render();
    try {
      await this._client.registerGuarantor(data);
      this._guarantorView = 'dashboard';
      this._announce(this.t('guarDashTitle'));
      this._error = null;
      this._loadGuarantorDashboard();
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
      this._loading = false;
      this._render();
    }
  }

  async _loadGuarantorDashboard() {
    this._loading = true;
    this._render();
    try {
      // Placeholder: the API doesn't have a dedicated dashboard endpoint yet
      this._guarantorDashData = [];
      this._error = null;
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _renderGuarantorDashboard() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('guarDashTitle');
    card.appendChild(h2);

    // Active
    const activeH3 = document.createElement('h3');
    activeH3.textContent = this.t('guarDashActive');
    card.appendChild(activeH3);

    const pending = this._guarantorDashData.filter(g => g.status === 'pending');
    const active = this._guarantorDashData.filter(g => g.status !== 'pending');

    if (active.length === 0 && pending.length === 0) {
      const none = document.createElement('p');
      none.textContent = this.t('guarDashNone');
      none.style.color = '#6b7e8a';
      card.appendChild(none);
    }

    if (active.length > 0) {
      card.appendChild(this._renderGuaranteeTable(active));
    }

    // Pending
    if (pending.length > 0) {
      const pendH3 = document.createElement('h3');
      pendH3.textContent = this.t('guarDashPending');
      card.appendChild(pendH3);
      card.appendChild(this._renderGuaranteeTable(pending));
    }

    return card;
  }

  _renderGuaranteeTable(items) {
    const table = document.createElement('table');
    table.className = 'waas-table';
    table.innerHTML = `
      <thead><tr>
        <th>Beneficiary</th>
        <th>Type</th>
        <th>Status</th>
        <th>Date</th>
      </tr></thead>
    `;
    const tbody = document.createElement('tbody');
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this._escHtml(item.beneficiary || 'N/A')}</td>
        <td>${this._escHtml(item.type || 'N/A')}</td>
        <td><span class="badge badge-${item.status || 'pending'}">${this._escHtml(item.status || 'pending')}</span></td>
        <td>${this._escHtml(item.date || 'N/A')}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INSTITUTIONAL FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  _renderInstitutionalFlow() {
    const wrap = document.createElement('div');

    // Sub-nav
    const nav = document.createElement('div');
    nav.className = 'mode-nav';
    [
      { key: 'register', label: this.t('orgRegTitle') },
      { key: 'dashboard', label: this.t('orgDashTitle') },
    ].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.type = 'button';
      btn.textContent = m.label;
      btn.setAttribute('aria-pressed', this._orgView === m.key ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this._orgView = m.key;
        if (m.key === 'dashboard') this._loadOrgDashboard();
        else this._render();
      });
      nav.appendChild(btn);
    });
    wrap.appendChild(nav);

    if (this._orgView === 'register') {
      wrap.appendChild(this._renderOrgRegForm());
    } else {
      wrap.appendChild(this._renderOrgDashboard());
    }
    return wrap;
  }

  _renderOrgRegForm() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('orgRegTitle');
    card.appendChild(h2);

    const form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this._validateForm(form)) {
        this._registerOrganization(form);
      }
    });

    // Org Name
    form.appendChild(this._field('text', 'waas-org-name', this.t('orgRegName'), { required: true }));

    // Registration Ref
    form.appendChild(this._field('text', 'waas-org-ref', this.t('orgRegRef'), { required: true }));

    // Contact Email
    form.appendChild(this._field('email', 'waas-org-email', this.t('orgRegEmail'), { required: true }));

    // Contact Phone
    form.appendChild(this._field('tel', 'waas-org-phone', this.t('orgRegPhone'), { required: true }));

    // Representative Name
    form.appendChild(this._field('text', 'waas-org-rep', this.t('orgRegRepName'), { required: true }));

    // Authority Evidence
    const authGroup = document.createElement('div');
    authGroup.className = 'form-group';
    const authLabel = document.createElement('label');
    authLabel.setAttribute('for', 'waas-org-auth');
    authLabel.textContent = this.t('orgRegAuthority');
    authGroup.appendChild(authLabel);
    const authTextarea = document.createElement('textarea');
    authTextarea.id = 'waas-org-auth';
    authTextarea.rows = 3;
    authTextarea.required = true;
    authGroup.appendChild(authTextarea);
    form.appendChild(authGroup);

    // Endorsement Types
    const etH3 = document.createElement('h3');
    etH3.textContent = this.t('orgRegEndorsementTypes');
    form.appendChild(etH3);
    ['Employment', 'Training', 'Character', 'Financial'].forEach(t => {
      const g = document.createElement('div');
      g.className = 'checkbox-group';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `waas-org-et-${t.toLowerCase()}`;
      cb.value = t.toLowerCase();
      g.appendChild(cb);
      const lbl = document.createElement('label');
      lbl.setAttribute('for', `waas-org-et-${t.toLowerCase()}`);
      lbl.textContent = t;
      g.appendChild(lbl);
      form.appendChild(g);
    });

    // Scope Limitations
    const scopeGroup = document.createElement('div');
    scopeGroup.className = 'form-group';
    const scopeLabel = document.createElement('label');
    scopeLabel.setAttribute('for', 'waas-org-scope');
    scopeLabel.textContent = this.t('orgRegScope');
    scopeLabel.className = 'label-optional';
    scopeGroup.appendChild(scopeLabel);
    const scopeTextarea = document.createElement('textarea');
    scopeTextarea.id = 'waas-org-scope';
    scopeTextarea.rows = 2;
    scopeGroup.appendChild(scopeTextarea);
    form.appendChild(scopeGroup);

    // Submit
    const actions = document.createElement('div');
    actions.className = 'actions actions-end';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.type = 'submit';
    btn.textContent = this.t('orgRegSubmit');
    actions.appendChild(btn);
    form.appendChild(actions);

    card.appendChild(form);
    return card;
  }

  async _registerOrganization(form) {
    const etypes = [];
    form.querySelectorAll('[id^="waas-org-et-"]').forEach(cb => {
      if (cb.checked) etypes.push(cb.value);
    });

    const data = {
      org_name: form.querySelector('#waas-org-name').value.trim(),
      registration_ref: form.querySelector('#waas-org-ref').value.trim(),
      contact_email: form.querySelector('#waas-org-email').value.trim(),
      contact_phone: form.querySelector('#waas-org-phone').value.trim(),
      representative_name: form.querySelector('#waas-org-rep').value.trim(),
      representative_authority: form.querySelector('#waas-org-auth').value.trim(),
      endorsement_types: etypes,
      scope_limitations: form.querySelector('#waas-org-scope').value.trim(),
    };

    this._loading = true;
    this._render();
    try {
      await this._client.registerOrganization(data);
      this._orgView = 'dashboard';
      this._announce(this.t('orgDashTitle'));
      this._error = null;
      this._loadOrgDashboard();
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
      this._emitError(err);
      this._loading = false;
      this._render();
    }
  }

  async _loadOrgDashboard() {
    this._loading = true;
    this._render();
    try {
      this._orgDashData = [];
      this._error = null;
    } catch (err) {
      this._error = err.message || this.t('errNetwork');
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _renderOrgDashboard() {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('orgDashTitle');
    card.appendChild(h2);

    const h3 = document.createElement('h3');
    h3.textContent = this.t('orgDashEndorsements');
    card.appendChild(h3);

    if (this._orgDashData.length === 0) {
      const none = document.createElement('p');
      none.textContent = this.t('orgDashNone');
      none.style.color = '#6b7e8a';
      card.appendChild(none);
    } else {
      const table = document.createElement('table');
      table.className = 'waas-table';
      table.innerHTML = `
        <thead><tr>
          <th>Applicant</th>
          <th>Type</th>
          <th>Status</th>
          <th>Actions</th>
        </tr></thead>
      `;
      const tbody = document.createElement('tbody');
      this._orgDashData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${this._escHtml(item.applicant || 'N/A')}</td>
          <td>${this._escHtml(item.type || 'N/A')}</td>
          <td><span class="badge badge-${item.status || 'pending'}">${this._escHtml(item.status || 'pending')}</span></td>
          <td></td>
        `;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      card.appendChild(table);
    }

    return card;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EMPLOYER VERIFICATION FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  _renderEmployerFlow() {
    const wrap = document.createElement('div');

    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = this.t('empTitle');
    card.appendChild(h2);

    // Input area
    const form = document.createElement('form');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const waasId = form.querySelector('#waas-emp-id').value.trim();
      if (waasId) this._verifyCredential(waasId);
    });

    form.appendChild(this._field('text', 'waas-emp-id', this.t('empWaasIdLabel'), {
      required: true, placeholder: this.t('empWaasIdPlaceholder'),
    }));

    const actions = document.createElement('div');
    actions.className = 'actions';

    const verifyBtn = document.createElement('button');
    verifyBtn.className = 'btn-primary';
    verifyBtn.type = 'submit';
    verifyBtn.textContent = `🔍 ${this.t('empVerify')}`;
    actions.appendChild(verifyBtn);

    const scanBtn = document.createElement('button');
    scanBtn.className = 'btn-outline';
    scanBtn.type = 'button';
    scanBtn.textContent = `📷 ${this.t('empScanQR')}`;
    scanBtn.setAttribute('aria-label', this.t('empScanQR'));
    scanBtn.addEventListener('click', () => {
      // QR scan placeholder
      this._announce('QR scanning is not yet available in this version.');
    });
    actions.appendChild(scanBtn);

    form.appendChild(actions);
    card.appendChild(form);

    // Result
    if (this._verifyResult) {
      card.appendChild(this._renderVerificationResult());
    }

    wrap.appendChild(card);
    return wrap;
  }

  async _verifyCredential(waasId) {
    this._loading = true;
    this._verifyResult = null;
    this._render();
    try {
      const res = await this._client.verifyCredential(waasId);
      this._verifyResult = res;
      this._emit('db-waas:verification-completed', { waasId, result: res });
      this._error = null;
    } catch (err) {
      if (err.status === 404) {
        this._verifyResult = { status: 'INVALID' };
      } else {
        this._error = err.message || this.t('errNetwork');
        this._emitError(err);
      }
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _renderVerificationResult() {
    const res = this._verifyResult;
    const status = (res.verification_status || res.status || 'INVALID').toUpperCase();
    const credential = res.credential || res;

    const div = document.createElement('div');
    div.className = 'verification-result';
    div.setAttribute('role', 'region');
    div.setAttribute('aria-label', this.t('empResult'));

    // Status icon
    const iconMap = { VALID: '✅', EXPIRED: '⚠️', REVOKED: '❌', INVALID: '❌', PENDING_VERIFICATION: '🔵' };
    const labelMap = { VALID: 'empValid', EXPIRED: 'empExpired', REVOKED: 'empRevoked', INVALID: 'empInvalid', PENDING_VERIFICATION: 'empPending' };

    const icon = document.createElement('div');
    icon.className = 'verification-status-icon';
    icon.textContent = iconMap[status] || '❓';
    icon.setAttribute('aria-hidden', 'true');
    div.appendChild(icon);

    const statusText = document.createElement('div');
    statusText.className = `verification-status-text status-${status}`;
    statusText.textContent = this.t(labelMap[status] || 'empInvalid');
    div.appendChild(statusText);

    // Details for VALID
    if (status === 'VALID' && credential) {
      const grid = document.createElement('div');
      grid.className = 'detail-grid';

      const validDetails = [
        { label: this.t('empCredType'), value: credential.credential_type || credential.type || 'N/A' },
        { label: this.t('empGuarantor'), value: credential.guarantor_ref || credential.guarantor || 'N/A' },
        { label: this.t('empIdTier'), value: credential.id_verification_tier || credential.tier || 'N/A' },
        { label: this.t('empScope'), value: credential.scope || 'N/A' },
        { label: this.t('empIssuedOn'), value: credential.issue_date || 'N/A' },
        { label: this.t('empExpiresOn'), value: credential.expiry_date || 'N/A' },
      ];

      validDetails.forEach(d => {
        const lbl = document.createElement('span');
        lbl.className = 'detail-label';
        lbl.textContent = d.label;
        grid.appendChild(lbl);
        const val = document.createElement('span');
        val.className = 'detail-value';
        val.textContent = d.value;
        grid.appendChild(val);
      });
      div.appendChild(grid);
    }

    // Listen button (SpeechSynthesis)
    const listenBtn = document.createElement('button');
    listenBtn.className = 'btn-outline';
    listenBtn.type = 'button';
    listenBtn.style.marginTop = '16px';

    if (this._speaking) {
      listenBtn.textContent = `🔇 ${this.t('empStopListen')}`;
      listenBtn.addEventListener('click', () => {
        this._stopSpeech();
        this._render();
      });
    } else {
      listenBtn.textContent = `🔊 ${this.t('empListen')}`;
      listenBtn.addEventListener('click', () => {
        const summary = this._buildVerificationSummary(status, credential);
        this._speak(summary);
      });
    }
    div.appendChild(listenBtn);

    return div;
  }

  _buildVerificationSummary(status, credential) {
    if (status === 'VALID') {
      return `Verification result: Valid. Credential type: ${credential.credential_type || credential.type || 'WaaS Guarantee'}. Guarantor: ${credential.guarantor_ref || credential.guarantor || 'Unknown'}. Scope: ${credential.scope || 'General'}. Issued on ${credential.issue_date || 'unknown date'}. Expires on ${credential.expiry_date || 'unknown date'}.`;
    }
    if (status === 'EXPIRED') return 'Verification result: Expired. This credential has passed its expiry date and is no longer valid.';
    if (status === 'REVOKED') return 'Verification result: Revoked. This credential has been revoked and is no longer valid.';
    if (status === 'PENDING_VERIFICATION') return 'Verification result: Pending Verification. This credential is still being processed.';
    return 'Verification result: Invalid. No valid credential was found for this ID.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FORM HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  _field(type, id, label, opts = {}) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = label;
    if (opts.optional) lbl.className = 'label-optional';
    group.appendChild(lbl);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    if (opts.required) input.required = true;
    if (opts.value !== undefined) input.value = opts.value;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.pattern) input.pattern = opts.pattern;
    if (opts.min) input.min = opts.min;
    if (opts.max) input.max = opts.max;

    const errId = `${id}-error`;
    input.setAttribute('aria-describedby', errId);

    group.appendChild(input);

    const errDiv = document.createElement('div');
    errDiv.id = errId;
    errDiv.className = 'error-msg';
    errDiv.setAttribute('role', 'alert');
    group.appendChild(errDiv);

    return group;
  }

  _select(id, label, options, opts = {}) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = label;
    if (opts.optional) lbl.className = 'label-optional';
    group.appendChild(lbl);

    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    if (opts.required) select.required = true;

    const errId = `${id}-error`;
    select.setAttribute('aria-describedby', errId);

    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.l;
      if (opts.value === o.v) opt.selected = true;
      select.appendChild(opt);
    });

    group.appendChild(select);

    const errDiv = document.createElement('div');
    errDiv.id = errId;
    errDiv.className = 'error-msg';
    errDiv.setAttribute('role', 'alert');
    group.appendChild(errDiv);

    return group;
  }

  _validateForm(form) {
    let valid = true;
    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(el => {
      const errEl = el.parentElement.querySelector('.error-msg');
      if (!el.value || !el.value.trim()) {
        el.setAttribute('aria-invalid', 'true');
        if (errEl) errEl.textContent = this.t('errRequired');
        valid = false;
      } else if (el.type === 'tel' && el.pattern && !new RegExp(el.pattern).test(el.value)) {
        el.setAttribute('aria-invalid', 'true');
        if (errEl) errEl.textContent = this.t('errPhoneFormat');
        valid = false;
      } else {
        el.removeAttribute('aria-invalid');
        if (errEl) errEl.textContent = '';
      }
    });
    if (!valid) {
      this._announce(this.t('errValidation'));
    }
    return valid;
  }
}

// ─── SECTION 5: REGISTRATION ─────────────────────────────────────────────────

if (!customElements.get('db-waas')) {
  customElements.define('db-waas', DbWaas);
}
if (!customElements.get('digital-waas')) {
  customElements.define('digital-waas', class extends DbWaas {});
}

export { DbWaas, WaasClient };
export default DbWaas;
