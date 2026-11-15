const { getDatabase } = require('./db');

console.log('Initializing Lumo WaaS Database (schema & initial seed)...');
const db = getDatabase();
console.log('✓ WaaS Database initialized successfully at api/database/waas.db');
