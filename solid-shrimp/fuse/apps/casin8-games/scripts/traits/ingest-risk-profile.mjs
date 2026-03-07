import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..', '..');

function arg(name, fallback = null) {
  const ix = process.argv.indexOf(name);
  if (ix < 0 || ix + 1 >= process.argv.length) return fallback;
  return process.argv[ix + 1];
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function clip(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function canonicalJson(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => canonicalJson(x)).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

const statePath = arg('--state', path.join(root, '.data', 'state.json'));
const riskDbPath = arg('--riskdb', path.join(root, '.data', 'riskdb.json'));
const output = arg('--output', path.join(root, '.data', 'traits', 'risk-profiles.json'));
const quarantineOutput = arg('--quarantine-output', path.join(root, '.data', 'traits', 'risk-profiles-quarantine.json'));
const seed = Number(arg('--seed', 20260227));
const traitArtifactSecret = String(process.env.CASIN8_TRAIT_ARTIFACT_SECRET || '').trim();
let commitSha = String(process.env.GITHUB_SHA || '').trim();
if (!commitSha) {
  try {
    commitSha = String(execSync('git rev-parse --short HEAD', { cwd: root }).toString('utf8') || '').trim();
  } catch {
    commitSha = 'unknown';
  }
}

const state = loadJson(statePath, { sessions: {} });
const riskdb = loadJson(riskDbPath, { tables: { compliance_profiles: [], risk_alerts: [] } });
const complianceRows = Array.isArray(riskdb?.tables?.compliance_profiles) ? riskdb.tables.compliance_profiles : [];
const alertRows = Array.isArray(riskdb?.tables?.risk_alerts) ? riskdb.tables.risk_alerts : [];

const players = new Set();
for (const id of Object.keys(state.sessions || {})) players.add(String(id));
for (const row of complianceRows) players.add(String(row?.playerId || '').trim());

const profiles = [];
const quarantined = [];
for (const playerId of players) {
  if (!playerId) continue;
  const compliance = complianceRows.find((x) => String(x?.playerId || '') === playerId) || null;
  const alerts = alertRows.filter((x) => String(x?.playerId || x?.subjectId || '') === playerId);
  const session = state.sessions && state.sessions[playerId] ? state.sessions[playerId] : null;

  const amlRisk = String(compliance?.amlRiskLevel || 'low').toLowerCase();
  const amlScore = amlRisk === 'high' ? 80 : amlRisk === 'medium' ? 50 : 20;
  const bannedScore = compliance?.banned ? 100 : 0;
  const alertsScore = clip(alerts.length * 18, 0, 100);
  const rounds = Math.max(0, Number(session?.rounds || 0));
  const bankroll = Math.max(0, Number(session?.bankroll || 0));
  const volatilityScore = clip(rounds > 0 ? Math.abs(bankroll - 1000) / 20 : 10, 0, 100);
  const collusionScore = clip(
    alerts.filter((x) => String(x?.type || '').toLowerCase().includes('collusion')).length * 35,
    0,
    100
  );
  const tiltIndexBps = clip(Math.round(2000 + volatilityScore * 80 + alerts.length * 180), 500, 10000);
  const riskScore = clip(Math.round(amlScore * 0.4 + alertsScore * 0.35 + volatilityScore * 0.25 + bannedScore * 0.2), 0, 100);

  const row = {
    schemaVersion: 1,
    payloadVersion: 1,
    provider: 'risk_profile',
    playerId,
    generatedAt: new Date().toISOString(),
    provenance: {
      generator: 'scripts/traits/ingest-risk-profile.mjs',
      generatorVersion: '1.0.0',
      commitSha,
      seed,
    },
    riskProfile: {
      riskScore,
      collusionScore,
      tiltIndexBps,
      abuseFlags: alerts.slice(0, 6).map((x) => String(x?.type || x?.eventType || 'risk_alert')),
      evidence: {
        amlRiskLevel: amlRisk,
        banned: Boolean(compliance?.banned),
        alertCount: alerts.length,
        rounds,
      },
    },
  };
  if (traitArtifactSecret) {
    const signPayload = {
      payloadVersion: row.payloadVersion,
      provider: row.provider,
      agentId: row.playerId,
      context: null,
      solverDump: null,
      cfrProfile: null,
      riskProfile: row.riskProfile,
      provenance: row.provenance,
    };
    row.signature = {
      alg: 'hmac-sha256',
      value: crypto.createHmac('sha256', traitArtifactSecret).update(canonicalJson(signPayload)).digest('hex'),
      keyId: 'env:CASIN8_TRAIT_ARTIFACT_SECRET',
    };
  }
  const anomalous =
    row.riskProfile.riskScore < 0 ||
    row.riskProfile.riskScore > 100 ||
    row.riskProfile.collusionScore < 0 ||
    row.riskProfile.collusionScore > 100 ||
    row.riskProfile.tiltIndexBps < 500 ||
    row.riskProfile.tiltIndexBps > 10000;
  if (anomalous) quarantined.push(row);
  else profiles.push(row);
}

const out = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    statePath,
    riskDbPath,
  },
  profiles,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  quarantineOutput,
  `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), profiles: quarantined }, null, 2)}\n`,
  'utf8'
);
process.stdout.write(
  `${JSON.stringify({ ok: true, output, quarantineOutput, profiles: profiles.length, quarantined: quarantined.length }, null, 2)}\n`
);
