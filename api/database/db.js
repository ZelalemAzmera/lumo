/**
 * Database connection & query helper
 * Uses node:sqlite (native in Node 22+) with fallback to better-sqlite3
 */

const fs = require('fs');
const path = require('path');

let DatabaseDriver;
try {
  DatabaseDriver = require('better-sqlite3');
} catch (e) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    DatabaseDriver = class extends DatabaseSync {
      constructor(filename, options) {
        super(filename, options || {});
      }
      prepare(sql) {
        const stmt = super.prepare(sql);
        return {
          get: (...args) => stmt.get(...args),
          all: (...args) => stmt.all(...args),
          run: (...args) => {
            const res = stmt.run(...args);
            return {
              changes: res.changes,
              lastInsertRowid: res.lastInsertRowid
            };
          }
        };
      }
    };
  } catch (err) {
    throw new Error('No SQLite driver available: install better-sqlite3 or run with Node.js 22+ (node:sqlite)');
  }
}

function getDatabase(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, 'waas.db');
  const db = new DatabaseDriver(resolvedPath);

  // Initialize schema if not exists
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Ensure new columns and tables are migrated on existing databases
  try {
    const credCols = db.prepare('PRAGMA table_info(credentials)').all().map(c => c.name);
    if (!credCols.includes('suspended')) {
      db.prepare('ALTER TABLE credentials ADD COLUMN suspended INTEGER DEFAULT 0').run();
    }
    if (!credCols.includes('suspended_reason')) {
      db.prepare('ALTER TABLE credentials ADD COLUMN suspended_reason TEXT').run();
    }
    if (!credCols.includes('coordinator_credential_id')) {
      db.prepare('ALTER TABLE credentials ADD COLUMN coordinator_credential_id TEXT').run();
    }
    if (!credCols.includes('tenant_id')) {
      db.prepare('ALTER TABLE credentials ADD COLUMN tenant_id TEXT DEFAULT "default"').run();
    }

    const reqCols = db.prepare('PRAGMA table_info(waas_requests)').all().map(c => c.name);
    if (!reqCols.includes('tenant_id')) {
      db.prepare('ALTER TABLE waas_requests ADD COLUMN tenant_id TEXT DEFAULT "default"').run();
    }

    const instCols = db.prepare('PRAGMA table_info(institutional_guarantors)').all().map(c => c.name);
    if (!instCols.includes('tenant_id')) {
      db.prepare('ALTER TABLE institutional_guarantors ADD COLUMN tenant_id TEXT DEFAULT "default"').run();
    }

    // Check if waas_requests needs migration to permit 'declined' status
    const reqTableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='waas_requests'").get();
    if (reqTableInfo && reqTableInfo.sql && !reqTableInfo.sql.includes('declined')) {
      db.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE IF NOT EXISTS waas_requests_temp (
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
        INSERT INTO waas_requests_temp (id, applicant_id, guarantor_type, guarantor_id, purpose, status, consent_applicant, consent_guarantor, scope, tenant_id, validity_start, validity_end, created_at, updated_at)
        SELECT id, applicant_id, guarantor_type, guarantor_id, purpose, status, consent_applicant, consent_guarantor, scope, COALESCE(tenant_id, 'default'), validity_start, validity_end, created_at, updated_at
        FROM waas_requests;
        DROP TABLE waas_requests;
        ALTER TABLE waas_requests_temp RENAME TO waas_requests;
        PRAGMA foreign_keys=on;
      `);
    }
  } catch (err) {
    // Non-fatal if table doesn't exist yet
  }

  // Seed sample verified institutional and individual guarantors if empty
  seedInitialData(db);

  return db;
}

function seedInitialData(db) {
  try {
    const count = db.prepare('SELECT count(*) as c FROM institutional_guarantors').get();
    if (count && count.c === 0) {
      // Seed institutions
      const insertInst = db.prepare(`
        INSERT INTO institutional_guarantors (
          id, org_name, registration_ref, contact_email, contact_phone,
          representative_name, representative_authority, endorsement_types_json,
          scope_limitations, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      insertInst.run(
        'inst-alx-ethiopia',
        'ALX Ethiopia Education Partner',
        'REG-ETH-EDU-2024-8891',
        'partnerships@alxethiopia.com',
        '+251911223344',
        'Bethlehem Tadesse',
        'Country Director',
        JSON.stringify(['education', 'employment', 'internship']),
        'Covers certified software & digital skills graduates for professional placements'
      );

      insertInst.run(
        'inst-refugee-tech',
        'Refugee Digital Integration Initiative',
        'REG-UNHCR-NGO-2023-412',
        'support@refugeetech.et',
        '+251922334455',
        'Yonas Mengistu',
        'Operations Lead',
        JSON.stringify(['employment', 'training', 'accommodation']),
        'Community verification and guarantor support for displaced learners'
      );

      // Seed individual guarantor
      const insertIndiv = db.prepare(`
        INSERT INTO individual_guarantors (
          id, full_name, phone, id_status, references_json, guarantee_types_json, max_active, consent_given
        ) VALUES (?, ?, ?, 'verified', ?, ?, 3, 1)
      `);

      insertIndiv.run(
        'guar-indiv-abebe',
        'Abebe Kebede (Senior Software Architect)',
        '+251911998877',
        JSON.stringify(['Former Tech Mentor at ALX Hub', 'Community Lead']),
        JSON.stringify(['employment', 'training'])
      );
    }
  } catch (err) {
    console.warn('[WaaS DB] Seed warning:', err.message);
  }
}

module.exports = { getDatabase };
