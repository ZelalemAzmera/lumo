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
