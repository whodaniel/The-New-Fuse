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

function parseRows(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(raw)) return [];
  return raw;
}

function normalizeAction(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('fold')) return 'fold';
  if (raw.includes('check')) return 'check';
  if (raw.includes('call')) return 'call';
  if (raw.includes('raise')) return 'raise';
  if (raw.includes('bet')) return 'bet';
  if (raw.includes('allin') || raw.includes('all-in') || raw === 'jam') return 'allin';
  return null;
}

function buildActionMix(rows) {
  const totals = { fold: 0, check: 0, call: 0, raise: 0, bet: 0, allin: 0 };
  let totalWeight = 0;
  for (const row of rows) {
    const action = normalizeAction(row?.action);
    if (!action) continue;
    const weight = Math.max(0, Number(row?.weight ?? 1));
    if (!Number.isFinite(weight) || weight <= 0) continue;
    totals[action] += weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) {
    return { fold: 0.2, check: 0.12, call: 0.24, raise: 0.32, bet: 0.08, allin: 0.04 };
  }
  return {
    fold: totals.fold / totalWeight,
    check: totals.check / totalWeight,
    call: totals.call / totalWeight,
    raise: totals.raise / totalWeight,
    bet: totals.bet / totalWeight,
    allin: totals.allin / totalWeight,
  };
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

const source = arg('--source', null);
const output = arg('--output', path.join(root, '.data', 'traits', 'cfr-profile.json'));
const exploitabilityBb100 = Number(arg('--exploitability', 5));
const sampleHands = Number(arg('--hands', 10000));
const profileId = String(arg('--profile-id', 'cfr-nightly-v1'));
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

const rows = parseRows(source);
const actionMix = buildActionMix(rows);
const out = {
  schemaVersion: 1,
  payloadVersion: 1,
  provider: 'cfr_profile',
  profileId,
  generatedAt: new Date().toISOString(),
  source: source || 'synthetic-default',
  sampleHands: Math.max(1, Math.round(Number.isFinite(sampleHands) ? sampleHands : 1)),
  exploitabilityBb100: Math.max(0, Number.isFinite(exploitabilityBb100) ? exploitabilityBb100 : 0),
  actionMix,
  provenance: {
    generator: 'scripts/traits/export-cfr-profile.mjs',
    generatorVersion: '1.0.0',
    commitSha,
    seed,
  },
};
if (traitArtifactSecret) {
  const signPayload = {
    payloadVersion: out.payloadVersion,
    provider: out.provider,
    agentId: profileId,
    context: null,
    solverDump: null,
    cfrProfile: {
      actionMix: out.actionMix,
      exploitabilityBb100: out.exploitabilityBb100,
      sampleHands: out.sampleHands,
    },
    riskProfile: null,
    provenance: out.provenance,
  };
  const signature = crypto
    .createHmac('sha256', traitArtifactSecret)
    .update(canonicalJson(signPayload))
    .digest('hex');
  out.signature = { alg: 'hmac-sha256', value: signature, keyId: 'env:CASIN8_TRAIT_ARTIFACT_SECRET' };
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: true, output, profileId }, null, 2)}\n`);
