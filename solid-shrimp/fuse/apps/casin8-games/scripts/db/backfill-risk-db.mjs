import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..', '..');
const dataDir = path.join(root, '.data');
const statePath = path.join(dataDir, 'state.json');
const dbPath = path.join(dataDir, 'riskdb.json');

const require = createRequire(import.meta.url);
const { createRiskDb } = require(path.join(root, 'risk-db.js'));
const db = createRiskDb(dbPath);

let state = { sessions: {}, tables: {} };
if (fs.existsSync(statePath)) {
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    state = { sessions: {}, tables: {} };
  }
}

let complianceRows = 0;
let velocityRows = 0;
let riskRows = 0;

for (const session of Object.values(state.sessions || {})) {
  const playerId = String(session?.id || '').trim();
  if (!playerId) continue;
  db.upsertComplianceProfile({
    playerId,
    kycStatus: 'pending',
    countryCode: 'UNSPECIFIED',
    amlRiskLevel: 'low',
    banned: false,
    notes: `backfilled from state.json for ${String(session.playerName || 'player')}`,
    updatedAt: new Date().toISOString(),
  });
  complianceRows += 1;

  const rounds = Number(session?.rounds || 0);
  if (rounds > 0) {
    db.addVelocityEvent({
      id: `bf-vel-${playerId}`,
      playerId,
      tsMs: Date.now(),
      amountUnits: BigInt(Math.max(1, Number(session?.bankroll || 1))),
      action: 'backfill-session',
    });
    velocityRows += 1;
  }
}

for (const table of Object.values(state.tables || {})) {
  const events = Array.isArray(table?.events) ? table.events : [];
  for (const event of events.slice(0, 100)) {
    const type = String(event?.type || 'table-event');
    if (type.includes('error') || type.includes('reject') || type.includes('fail')) {
      db.addRiskAlert({
        id: `bf-risk-${Math.random().toString(36).slice(2, 10)}`,
        ts: new Date().toISOString(),
        type: 'backfill-table-incident',
        tableId: String(table?.id || ''),
        eventType: type,
      });
      riskRows += 1;
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  backfilled: {
    complianceRows,
    velocityRows,
    riskRows,
  },
  stats: db.stats(),
}, null, 2));
