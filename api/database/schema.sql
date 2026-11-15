-- Digital WaaS (ዋስ) Database Schema
-- Refugee Guarantor & Institutional Verification System

CREATE TABLE IF NOT EXISTS applicants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  lang TEXT DEFAULT 'en',
  origin_country TEXT,
  id_route TEXT,
  purpose TEXT,
  course_ref TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS identity_verifications (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  route TEXT NOT NULL,
  document_ref TEXT,
  status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','pending','verified','rejected','expired')),
  verified_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (applicant_id) REFERENCES applicants(id)
);

CREATE TABLE IF NOT EXISTS individual_guarantors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_status TEXT DEFAULT 'unverified',
  references_json TEXT DEFAULT '[]',
  guarantee_types_json TEXT DEFAULT '[]',
  max_active INTEGER DEFAULT 3,
  consent_given INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS institutional_guarantors (
  id TEXT PRIMARY KEY,
  org_name TEXT NOT NULL,
  registration_ref TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  representative_name TEXT,
  representative_authority TEXT,
  endorsement_types_json TEXT DEFAULT '[]',
  scope_limitations TEXT,
  verified INTEGER DEFAULT 0,
  tenant_id TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_admins (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  tenant_id TEXT DEFAULT 'default',
  permissions_json TEXT DEFAULT '["review","approve","revoke","issue"]',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES institutional_guarantors(id)
);

CREATE TABLE IF NOT EXISTS waas_requests (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  guarantor_type TEXT NOT NULL CHECK(guarantor_type IN ('individual','institutional')),
  guarantor_id TEXT,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','matched','approved','declined','issued','revoked','expired')),
  consent_applicant INTEGER DEFAULT 0,
  consent_guarantor INTEGER DEFAULT 0,
  scope TEXT,
  tenant_id TEXT DEFAULT 'default',
  validity_start TEXT,
  validity_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (applicant_id) REFERENCES applicants(id)
);

CREATE TABLE IF NOT EXISTS consent_tokens (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  guarantor_id TEXT NOT NULL,
  tenant_id TEXT DEFAULT 'default',
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (request_id) REFERENCES waas_requests(id)
);

CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  waas_request_id TEXT NOT NULL,
  waas_id_public TEXT NOT NULL UNIQUE,
  credential_type TEXT DEFAULT 'WaaSCredential',
  beneficiary_ref TEXT,
  guarantor_ref TEXT,
  id_verification_tier TEXT,
  verification_status TEXT DEFAULT 'PENDING_VERIFICATION',
  issuer TEXT DEFAULT 'WaaS Platform',
  issue_date TEXT,
  expiry_date TEXT,
  scope TEXT,
  signature TEXT,
  revoked INTEGER DEFAULT 0,
  revocation_reason TEXT,
  suspended INTEGER DEFAULT 0,
  suspended_reason TEXT,
  coordinator_credential_id TEXT,
  tenant_id TEXT DEFAULT 'default',
  qr_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (waas_request_id) REFERENCES waas_requests(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  actor TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verifications_applicant ON identity_verifications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_waas_requests_applicant ON waas_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_waas_requests_guarantor ON waas_requests(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_credentials_waas_request ON credentials(waas_request_id);
CREATE INDEX IF NOT EXISTS idx_credentials_public_id ON credentials(waas_id_public);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
