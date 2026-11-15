/**
 * Integration Test Suite for Lumo WaaS API
 * Validates full end-to-end guarantor and verification flows.
 */

const { app, server } = require('./server');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'waas_demo_token_2026';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n=== Starting WaaS API Integration Tests ===\n');

  try {
    // 1. Health check
    console.log('[Test 1] Health Check');
    const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
    const health = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns 200');
    assert(health.status === 'healthy', 'Health status is healthy');
    assert(health.service === 'Lumo-WaaS-Plugin', 'Service identity is Lumo-WaaS-Plugin');

    // 2. Guarantor Directory
    console.log('\n[Test 2] Guarantor Directory (Data Minimization)');
    const guarRes = await fetch(`${BASE_URL}/api/v1/guarantors`);
    const guarData = await guarRes.json();
    assert(guarRes.status === 200, 'Guarantors directory returns 200');
    assert(Array.isArray(guarData.guarantors), 'Returns an array of guarantors');
    assert(guarData.guarantors.length >= 2, 'Directory contains seeded guarantors');
    
    // Check data minimization: no phone numbers
    const leakedPhone = guarData.guarantors.some(g => g.phone !== undefined);
    assert(!leakedPhone, 'Guarantor directory enforces data minimization (no phone numbers leaked)');

    // 3. Identity Submission (Alternative & Non-exclusionary)
    console.log('\n[Test 3] Identity Submission (Non-exclusionary)');
    const idSubmitRes = await fetch(`${BASE_URL}/api/v1/identity/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Fatima Ahmed',
        applicantType: 'refugee',
        idType: 'unhcr_refugee_cert',
        idNumber: 'UNHCR-ETH-2024-98765',
        phone: '+251911000111',
        email: 'fatima.refugee@example.org',
        campLocation: 'Tsore / Benishangul-Gumuz',
        notes: 'Refugee registration verified via RRS/UNHCR paper document'
      })
    });
    const idSubmit = await idSubmitRes.json();
    assert(idSubmitRes.status === 200, 'Identity submission returns 200');
    assert(idSubmit.success === true, 'Identity successfully submitted');
    const identityId = idSubmit.identityId;
    assert(Boolean(identityId), 'Generated an identityId');

    // 4. Guarantee Request
    console.log('\n[Test 4] Guarantee Request (Consent-based)');
    const reqRes = await fetch(`${BASE_URL}/api/v1/waas/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: 'Fatima Ahmed',
        applicantEmail: 'fatima.refugee@example.org',
        purpose: 'scholarship',
        requiredCapacity: 15000,
        currency: 'ETB',
        courseId: 'track2-alx-ai-foundations',
        preferredGuarantorType: 'institutional',
        consentGiven: true,
        consentScope: 'verification_and_course_enrollment'
      })
    });
    const reqData = await reqRes.json();
    assert(reqRes.status === 200, 'Guarantee request returns 200');
    assert(reqData.success === true, 'Guarantee request created');
    const requestId = reqData.requestId;
    assert(Boolean(requestId), 'Generated requestId: ' + requestId);

    // 5. Matching & Directory Search
    console.log('\n[Test 5] Explainable Matchmaking');
    const matchRes = await fetch(`${BASE_URL}/api/v1/guarantors/match/${requestId}`);
    const matchData = await matchRes.json();
    assert(matchRes.status === 200, 'Matching endpoint returns 200');
    assert(Array.isArray(matchData.matches), 'Matches returned as array');
    assert(matchData.matches.length > 0, 'Found at least 1 matching guarantor');
    const matchedGuarantor = matchData.matches[0];
    assert(Boolean(matchedGuarantor.matchReason), 'Match includes explainable criteria (no black-box scores)');

    // 6. Guarantor Approval (Consent-based)
    console.log('\n[Test 6] Guarantor Approval & Consent');
    const approveRes = await fetch(`${BASE_URL}/api/v1/waas/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Waas-Token': AUTH_TOKEN
      },
      body: JSON.stringify({
        guarantorId: matchedGuarantor.id,
        guarantorConsent: true,
        guaranteeAmount: 15000,
        currency: 'ETB',
        termsAccepted: true
      })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Approval returns 200');
    assert(approveData.success === true, 'Request approved with consent');
    assert(approveData.status === 'APPROVED', 'Status transitions to APPROVED');

    // 7. Credential Issuance (Open Badges 3.0 + QR Code)
    console.log('\n[Test 7] Credential Issuance (Open Badges 3.0)');
    const issueRes = await fetch(`${BASE_URL}/api/v1/waas/${requestId}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Waas-Token': AUTH_TOKEN
      },
      body: JSON.stringify({
        title: 'Verifiable Educational Guarantor Reference',
        description: 'Institutional guarantee for Digital Skills Program',
        expiresInDays: 365
      })
    });
    const issueData = await issueRes.json();
    assert(issueRes.status === 200, 'Issuance returns 200');
    assert(issueData.success === true, 'Credential issued successfully');
    const waasId = issueData.waasId;
    assert(Boolean(waasId), 'Issued WaaS ID: ' + waasId);
    assert(Boolean(issueData.credential), 'Contains Open Badges 3.0 credential');
    assert(issueData.credential['@context'].includes('https://www.w3.org/ns/credentials/v2'), 'W3C Verifiable Credential context present');
    assert(Boolean(issueData.qrCodeDataUrl), 'Generates QR Code data URL');

    // 8. Public Verification (Valid)
    console.log('\n[Test 8] Public Verification of Valid Reference');
    const verifyRes = await fetch(`${BASE_URL}/api/v1/waas/verify/${waasId}`);
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Verification returns 200');
    assert(verifyData.isValid === true, 'Reference is valid');
    assert(verifyData.status === 'VALID', 'Status is VALID');
    assert(verifyData.subject.name === 'Fatima Ahmed', 'Subject matches applicant name');
    assert(verifyData.signatureValid === true, 'Cryptographic signature is verified');

    // 9. Revocation & Audit
    console.log('\n[Test 9] Credential Revocation');
    const revokeRes = await fetch(`${BASE_URL}/api/v1/waas/revoke/${waasId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Waas-Token': AUTH_TOKEN
      },
      body: JSON.stringify({
        reason: 'Applicant completed program requirements; guarantee term concluded normally.'
      })
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.status === 200, 'Revoke returns 200');
    assert(revokeData.status === 'REVOKED', 'Revocation status recorded');

    // 10. Public Verification (Revoked)
    console.log('\n[Test 10] Public Verification of Revoked Reference');
    const reVerifyRes = await fetch(`${BASE_URL}/api/v1/waas/verify/${waasId}`);
    const reVerifyData = await reVerifyRes.json();
    assert(reVerifyRes.status === 200, 'Re-verification returns 200');
    assert(reVerifyData.isValid === false, 'Revoked credential is not valid');
    assert(reVerifyData.status === 'REVOKED', 'Status is accurately REVOKED');

    // 11. Protected Audit Trail
    console.log('\n[Test 11] Protected Audit Trail');
    const unauthAudit = await fetch(`${BASE_URL}/api/v1/waas/audit`);
    assert(unauthAudit.status === 401, 'Audit endpoint rejects unauthenticated request (401)');

    const authAudit = await fetch(`${BASE_URL}/api/v1/waas/audit`, {
      headers: { 'X-Waas-Token': AUTH_TOKEN }
    });
    const auditData = await authAudit.json();
    assert(authAudit.status === 200, 'Audit endpoint accepts valid token');
    assert(Array.isArray(auditData.logs), 'Audit returns logs array');
    assert(auditData.logs.length > 0, 'Audit contains logged actions');

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    testsFailed++;
  } finally {
    console.log(`\n========================================`);
    console.log(`Tests Passed: ${testsPassed}`);
    console.log(`Tests Failed: ${testsFailed}`);
    console.log(`========================================\n`);

    server.close(() => {
      console.log('Server stopped cleanly.');
      process.exit(testsFailed > 0 ? 1 : 0);
    });
  }
}

// Run test suite
runTests();
