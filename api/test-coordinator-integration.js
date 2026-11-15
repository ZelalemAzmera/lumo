/**
 * Comprehensive Automated Test Suite for DCC Issuer-Coordinator Integration
 * Tests all 16 required scenarios:
 * 1. Successful guarantor approval
 * 2. Rejected reference request
 * 3. Expired consent link
 * 4. Reused consent link
 * 5. Unauthorized issuance
 * 6. Duplicate credential issuance
 * 7. Valid credential verification
 * 8. Expired credential
 * 9. Revoked credential
 * 10. Invalid credential
 * 11. Tenant isolation
 * 12. Credential status synchronization
 * 13. Issuer-coordinator unavailable (resilient fallback)
 * 14. Signing failure
 * 15. Malformed input
 * 16. Rate limiting
 */

const { app, server } = require('./server');
const { getDatabase } = require('./database/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:3001';
const AUTH_TOKEN = 'waas_demo_token_2026';
const db = getDatabase();

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message, extra = null) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`, extra !== null ? JSON.stringify(extra) : '');
    testsFailed++;
  }
}

async function runCoordinatorTests() {
  console.log('\n=============================================================');
  console.log('=== DCC Issuer-Coordinator & WaaS Integration Test Suite ===');
  console.log('=============================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Successful guarantor approval
    // -------------------------------------------------------------
    console.log('[Test 1] Successful Guarantor Approval via Single-Use Consent Link');
    const req1Res = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: 'Tigist Hailu',
        phone: '+251911223344',
        purpose: 'education',
        courseRef: 'alx-software-engineering',
        consentApplicant: true
      })
    });
    const req1 = await req1Res.json();
    assert(req1Res.status === 200, 'Request 1 creation returns 200');
    assert(Boolean(req1.consentToken), 'Generated secure single-use consent token');

    // Guarantor opens and reviews consent link
    const reviewRes = await fetch(`${BASE_URL}/api/waas/consent/${req1.consentToken}`);
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 200, 'Guarantor can open consent review link');
    assert(reviewData.request.applicantName === 'Tigist Hailu', 'Review shows applicant name');

    // Guarantor approves
    const decideRes = await fetch(`${BASE_URL}/api/waas/consent/${req1.consentToken}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve', reason: 'Verified top student in ALX track' })
    });
    const decideData = await decideRes.json();
    assert(decideRes.status === 200, 'Consent decision returns 200');
    assert(decideData.decision === 'APPROVED', 'Decision is recorded as APPROVED');
    assert(Boolean(decideData.credential), 'Credential is automatically issued upon approval');
    const issuedWaasId1 = decideData.credential.waasId;

    // -------------------------------------------------------------
    // Test 2: Rejected reference request
    // -------------------------------------------------------------
    console.log('\n[Test 2] Rejected Reference Request Workflow');
    const req2Res = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: 'Dawit Bekele',
        phone: '+251922334455',
        purpose: 'employment',
        consentApplicant: true
      })
    });
    const req2 = await req2Res.json();

    const rejectRes = await fetch(`${BASE_URL}/api/waas/consent/${req2.consentToken}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'reject', reason: 'Guarantor maximum active commitments reached' })
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'Rejection returns 200', { status: rejectRes.status, body: rejectData });
    assert(rejectData.decision === 'REJECTED', 'Decision recorded as REJECTED', rejectData);

    const checkReq2 = await fetch(`${BASE_URL}/api/waas/requests/${req2.requestId}`);
    const checkData2 = await checkReq2.json();
    assert(checkData2.status === 'declined', 'Request status transitions to declined', checkData2);
    assert(checkData2.credential === null, 'No credential issued for rejected request');

    // -------------------------------------------------------------
    // Test 3: Expired consent link
    // -------------------------------------------------------------
    console.log('\n[Test 3] Expired Consent Link Rejection');
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    db.prepare(`
      INSERT INTO consent_tokens (id, request_id, token_hash, guarantor_id, tenant_id, expires_at, used)
      VALUES (?, ?, ?, 'inst-alx-ethiopia', 'default', datetime('now', '-2 days'), 0)
    `).run(`tok_${uuidv4().slice(0, 8)}`, req2.requestId, expiredTokenHash);

    const expiredGetRes = await fetch(`${BASE_URL}/api/waas/consent/${expiredRawToken}`);
    assert(expiredGetRes.status === 410, 'Accessing expired consent link returns 410 Gone');
    const expiredGetData = await expiredGetRes.json();
    assert(expiredGetData.error === 'TOKEN_EXPIRED', 'Error code is TOKEN_EXPIRED');

    const expiredDecideRes = await fetch(`${BASE_URL}/api/waas/consent/${expiredRawToken}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' })
    });
    assert(expiredDecideRes.status === 410, 'Submitting decision on expired link returns 410');

    // -------------------------------------------------------------
    // Test 4: Reused consent link (Replay Protection)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Reused Consent Link Prevention (Replay Protection)');
    const reusedRes = await fetch(`${BASE_URL}/api/waas/consent/${req1.consentToken}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' })
    });
    assert(reusedRes.status === 410, 'Attempting to reuse token returns 410 Gone');
    const reusedData = await reusedRes.json();
    assert(reusedData.error === 'TOKEN_REUSED', 'Error code indicates TOKEN_REUSED');

    // -------------------------------------------------------------
    // Test 5: Unauthorized issuance
    // -------------------------------------------------------------
    console.log('\n[Test 5] Unauthorized Issuance Prevention (Not Approved)');
    const req5Res = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: 'Marta Tesfaye',
        phone: '+251933445566',
        purpose: 'scholarship',
        consentApplicant: true
      })
    });
    const req5 = await req5Res.json();

    const prematureIssueRes = await fetch(`${BASE_URL}/api/waas/requests/${req5.requestId}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN }
    });
    assert(prematureIssueRes.status === 422, 'Issuing unapproved request returns 422 Unprocessable Entity');
    const prematureData = await prematureIssueRes.json();
    assert(prematureData.error === 'NOT_APPROVED', 'Error code is NOT_APPROVED');

    // -------------------------------------------------------------
    // Test 6: Duplicate credential issuance
    // -------------------------------------------------------------
    console.log('\n[Test 6] Duplicate Credential Issuance Prevention');
    const dupIssueRes = await fetch(`${BASE_URL}/api/waas/requests/${req1.requestId}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN }
    });
    assert(dupIssueRes.status === 409, 'Duplicate issuance attempt returns 409 Conflict');
    const dupData = await dupIssueRes.json();
    assert(dupData.error === 'DUPLICATE_ISSUANCE', 'Error code is DUPLICATE_ISSUANCE');

    // -------------------------------------------------------------
    // Test 7: Valid credential verification
    // -------------------------------------------------------------
    console.log('\n[Test 7] Valid Credential Public Verification');
    const verifyValidRes = await fetch(`${BASE_URL}/api/waas/verify/${issuedWaasId1}`);
    const verifyValidData = await verifyValidRes.json();
    assert(verifyValidRes.status === 200, 'Verification endpoint returns 200');
    assert(verifyValidData.isValid === true, 'Credential is valid');
    assert(verifyValidData.status === 'VALID', 'Status is accurately VALID');
    assert(verifyValidData.signatureValid === true, 'Cryptographic proof is valid');
    assert(verifyValidData.subject.name === 'Tigist Hailu', 'Subject matches applicant');

    // -------------------------------------------------------------
    // Test 8: Expired credential
    // -------------------------------------------------------------
    console.log('\n[Test 8] Expired Credential Status');
    const expWaasId = `WAAS-EXPIRED-${uuidv4().slice(0, 6).toUpperCase()}`;
    db.prepare(`
      INSERT INTO credentials (
        id, waas_request_id, waas_id_public, credential_type, beneficiary_ref, guarantor_ref,
        id_verification_tier, verification_status, issuer, issue_date, expiry_date, scope, signature
      ) VALUES (?, ?, ?, 'WaaSCredential', 'app_test', 'inst-alx-ethiopia', 'verified', 'VALID', 'WaaS Platform',
        datetime('now', '-2 years'), datetime('now', '-1 year'), 'General', 'demo_valid_sig_12345')
    `).run(uuidv4(), req1.requestId, expWaasId);

    const verifyExpiredRes = await fetch(`${BASE_URL}/api/waas/verify/${expWaasId}`);
    const verifyExpiredData = await verifyExpiredRes.json();
    assert(verifyExpiredRes.status === 200, 'Expired verification returns 200');
    assert(verifyExpiredData.isValid === false, 'Expired credential is not valid');
    assert(verifyExpiredData.status === 'EXPIRED', 'Status is EXPIRED');

    // -------------------------------------------------------------
    // Test 9: Revoked credential
    // -------------------------------------------------------------
    console.log('\n[Test 9] Credential Revocation Workflow');
    const revokeRes = await fetch(`${BASE_URL}/api/waas/credentials/${issuedWaasId1}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN },
      body: JSON.stringify({ reason: 'Student completed training; guarantee concluded.' })
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.status === 200, 'Revoke endpoint returns 200');
    assert(revokeData.status === 'REVOKED', 'Status changed to REVOKED');

    const verifyRevokedRes = await fetch(`${BASE_URL}/api/waas/verify/${issuedWaasId1}`);
    const verifyRevokedData = await verifyRevokedRes.json();
    assert(verifyRevokedData.isValid === false, 'Revoked credential is not valid');
    assert(verifyRevokedData.status === 'REVOKED', 'Verification status is REVOKED');

    // -------------------------------------------------------------
    // Test 10: Invalid credential
    // -------------------------------------------------------------
    console.log('\n[Test 10] Invalid Credential Lookup');
    const verifyInvalidRes = await fetch(`${BASE_URL}/api/waas/verify/WAAS-FAKE-NONEXISTENT-999`);
    const verifyInvalidData = await verifyInvalidRes.json();
    assert(verifyInvalidRes.status === 200, 'Verification check returns 200');
    assert(verifyInvalidData.isValid === false, 'Non-existent credential is not valid');
    assert(verifyInvalidData.status === 'INVALID', 'Status is INVALID');

    // -------------------------------------------------------------
    // Test 11: Tenant isolation
    // -------------------------------------------------------------
    console.log('\n[Test 11] Multi-Tenant Isolation Enforcement');
    const tenantReqRes = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': 'tenant_alx_ethiopia'
      },
      body: JSON.stringify({
        applicantName: 'Tenant Isolated User',
        phone: '+251911999999',
        purpose: 'education',
        consentApplicant: true
      })
    });
    const tenantReq = await tenantReqRes.json();

    // Another tenant attempts to read the record
    const crossTenantRes = await fetch(`${BASE_URL}/api/waas/requests/${tenantReq.requestId}`, {
      headers: { 'X-Tenant-Id': 'tenant_unauthorized_org' }
    });
    assert(crossTenantRes.status === 403, 'Cross-tenant request access is rejected with 403 Forbidden');
    const crossTenantData = await crossTenantRes.json();
    assert(crossTenantData.code === 'TENANT_MISMATCH', 'Rejection code is TENANT_MISMATCH');

    // -------------------------------------------------------------
    // Test 12: Credential status synchronization (Suspension & Reinstatement)
    // -------------------------------------------------------------
    console.log('\n[Test 12] Credential Status Synchronization (Suspend & Reinstate)');
    // Issue a new active credential
    const syncReqRes = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantName: 'Kidus Yohannes', phone: '+251911887766', consentApplicant: true })
    });
    const syncReq = await syncReqRes.json();
    const decideSyncRes = await fetch(`${BASE_URL}/api/waas/consent/${syncReq.consentToken}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' })
    });
    const decideSyncData = await decideSyncRes.json();
    const syncWaasId = decideSyncData.credential ? decideSyncData.credential.waasId : null;
    assert(Boolean(syncWaasId), 'Credential issued for status synchronization test', decideSyncData);

    // Suspend
    const suspendRes = await fetch(`${BASE_URL}/api/waas/credentials/${syncWaasId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN },
      body: JSON.stringify({ reason: 'Audit pending verification of supporting document' })
    });
    assert(suspendRes.status === 200, 'Suspend returns 200');
    const suspendVerify = await (await fetch(`${BASE_URL}/api/waas/verify/${syncWaasId}`)).json();
    assert(suspendVerify.status === 'SUSPENDED', 'Verification status synchronized to SUSPENDED');
    assert(suspendVerify.isValid === false, 'Suspended credential is not valid');

    // Reinstate
    const reinstateRes = await fetch(`${BASE_URL}/api/waas/credentials/${syncWaasId}/reinstate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN },
      body: JSON.stringify({ reason: 'Audit cleared successfully' })
    });
    assert(reinstateRes.status === 200, 'Reinstate returns 200');
    const reinstateVerify = await (await fetch(`${BASE_URL}/api/waas/verify/${syncWaasId}`)).json();
    assert(reinstateVerify.status === 'VALID', 'Verification status synchronized back to VALID');
    assert(reinstateVerify.isValid === true, 'Reinstated credential is valid again');

    // -------------------------------------------------------------
    // Test 13: Issuer-coordinator unavailable (Resilient Fallback)
    // -------------------------------------------------------------
    console.log('\n[Test 13] Resilient Fallback When External Coordinator is Offline');
    const fallbackReqRes = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantName: 'Fallback Test Student', phone: '+251911776655', consentApplicant: true })
    });
    const fallbackReq = await fallbackReqRes.json();
    
    // Approve request directly via administrative route
    await fetch(`${BASE_URL}/api/v1/waas/${fallbackReq.requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guarantorId: 'inst-alx-ethiopia' })
    });

    // Request issuance with forceLocal: true (simulates unreachable external coordinator)
    const fallbackIssueRes = await fetch(`${BASE_URL}/api/waas/requests/${fallbackReq.requestId}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Waas-Token': AUTH_TOKEN },
      body: JSON.stringify({ forceLocal: true })
    });
    assert(fallbackIssueRes.status === 200, 'Issuance succeeds despite coordinator unavailability', { status: fallbackIssueRes.status });
    const fallbackIssueData = await fallbackIssueRes.json();
    assert(fallbackIssueData.issuanceMode === 'local_cryptographic_engine', 'Engaged local cryptographic fallback engine', fallbackIssueData);
    assert(Boolean(fallbackIssueData.signature), 'Cryptographic signature generated successfully');

    // -------------------------------------------------------------
    // Test 14: Signing failure & Tamper Detection
    // -------------------------------------------------------------
    console.log('\n[Test 14] Tamper Detection & Cryptographic Verification Failure');
    const tamperedWaasId = `WAAS-TAMPERED-${uuidv4().slice(0, 6).toUpperCase()}`;
    db.prepare(`
      INSERT INTO credentials (
        id, waas_request_id, waas_id_public, credential_type, beneficiary_ref, guarantor_ref,
        id_verification_tier, verification_status, issuer, issue_date, expiry_date, scope, signature
      ) VALUES (?, ?, ?, 'WaaSCredential', 'app_test', 'inst-alx-ethiopia', 'verified', 'VALID', 'WaaS Platform',
        datetime('now'), datetime('now', '+1 year'), 'General', '')
    `).run(uuidv4(), req1.requestId, tamperedWaasId);

    const tamperedRes = await fetch(`${BASE_URL}/api/waas/verify/${tamperedWaasId}`);
    const tamperedData = await tamperedRes.json();
    assert(tamperedData.isValid === false, 'Tampered/empty signature is not valid');
    assert(tamperedData.status === 'INVALID', 'Status is declared INVALID');

    // -------------------------------------------------------------
    // Test 15: Malformed input validation
    // -------------------------------------------------------------
    console.log('\n[Test 15] Malformed Input & Bad Request Handling');
    const badReq1 = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+251911000000' }) // Missing applicantName
    });
    assert(badReq1.status === 400, 'Missing applicantName returns 400 Bad Request');

    const badReq2 = await fetch(`${BASE_URL}/api/waas/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantName: 'No Consent User', consentApplicant: false })
    });
    assert(badReq2.status === 422, 'Missing consent returns 422 Consent Required');

    // -------------------------------------------------------------
    // Test 16: Rate limiting
    // -------------------------------------------------------------
    console.log('\n[Test 16] Sliding-Window Rate Limiting Protection');
    let rateLimited = false;
    // Blast 150 requests rapidly to exceed the 120 req/min limit
    const promises = [];
    for (let i = 0; i < 150; i++) {
      promises.push(fetch(`${BASE_URL}/api/v1/health`));
    }
    const responses = await Promise.all(promises);
    rateLimited = responses.some(r => r.status === 429);
    assert(rateLimited, 'Rate limiter activates (429 Too Many Requests) under rapid burst traffic');

  } catch (err) {
    console.error('Unexpected error in coordinator test suite:', err);
    testsFailed++;
  } finally {
    console.log(`\n=============================================================`);
    console.log(`Coordinator Integration Tests Passed: ${testsPassed}`);
    console.log(`Coordinator Integration Tests Failed: ${testsFailed}`);
    console.log(`=============================================================\n`);

    server.close(() => {
      console.log('Server stopped cleanly.');
      process.exit(testsFailed > 0 ? 1 : 0);
    });
  }
}

// Run test suite
runCoordinatorTests();
