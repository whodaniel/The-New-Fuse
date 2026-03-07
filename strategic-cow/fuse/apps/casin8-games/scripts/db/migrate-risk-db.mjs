import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..', '..');
const dataDir = path.join(root, '.data');
const dbPath = path.join(dataDir, 'riskdb.json');

const require = createRequire(import.meta.url);
const { createRiskDb, CURRENT_SCHEMA_VERSION } = require(path.join(root, 'risk-db.js'));

const db = createRiskDb(dbPath);
const stats = db.stats();

console.log(JSON.stringify({
  ok: true,
  dbPath,
  targetSchemaVersion: CURRENT_SCHEMA_VERSION,
  stats,
}, null, 2));
