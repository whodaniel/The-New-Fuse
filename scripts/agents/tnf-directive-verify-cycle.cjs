#!/usr/bin/env node
/**
 * TNF Directive Verify Cycle (D1–D9)
 * Procedural, evidence-backed checks for the TNF CLI / Core Agent self-prompt loop.
 * HITL=OFF — this is the machine-verifiable depth Hermes claimed but did not land.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT =
  process.env.TNF_ROOT ||
  path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse');
const OUT_DIR = path.join(ROOT, '.verifier', 'directive-cycles');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const cycleId = `cycle-${stamp}`;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function safeStat(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    return { exists: false, rel, abs };
  }
  const st = fs.statSync(abs);
  const raw = fs.readFileSync(abs);
  return {
    exists: true,
    rel,
    abs,
    bytes: st.size,
    mtime: st.mtime.toISOString(),
    sha256: sha256(raw),
  };
}

function sh(cmd, fallback = '') {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    }).trim();
  } catch (err) {
    return fallback || `ERR:${err.message}`;
  }
}

function countMatches(rel, pattern) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return 0;
  const text = fs.readFileSync(abs, 'utf8');
  const re = new RegExp(pattern, 'gi');
  return (text.match(re) || []).length;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const checks = [];

function add(id, title, ok, detail, gate) {
  checks.push({ id, title, ok: Boolean(ok), detail, gate: gate || null });
}

// D1
const d1 = safeStat('docs/protocols/DIRECTIVE_CONVERSION_LEDGER.md');
const unconverted = d1.exists
  ? countMatches(d1.rel, 'unconverted|pending|TODO|\\[ \\]')
  : 0;
add(
  'D1',
  'Directive Conversion Ledger',
  d1.exists && d1.bytes > 0,
  { ...d1, unconvertedHint: unconverted },
  unconverted > 0 ? 'PRIORITIZE_UNBLOCK' : 'PASS'
);

// D2
const d2 = safeStat('docs/protocols/reports/TNF_PHASE7_BLOCKED_AUDIT.md');
const blocked = d2.exists ? countMatches(d2.rel, 'blocked|BLOCKED|stall') : 0;
add(
  'D2',
  'Phase 7 Blocked Audit',
  d2.exists && d2.bytes > 0,
  { ...d2, blockedHint: blocked },
  blocked > 0 ? 'INCLUDE_UNBLOCK_PLAN' : 'PASS'
);

// D3
const schema = safeStat('docs/protocols/schemas/tnf-cron-governance.schema.json');
const classif = safeStat(
  'docs/protocols/reports/DOC_AUDIT_POLICY_CLASSIFICATION_2026-07-14.md'
);
const synth = safeStat('docs/protocols/TNF_GOVERNANCE_SYNTHESIS_v2.0.md');
let schemaValid = false;
let schemaFields = {};
if (schema.exists) {
  try {
    const j = JSON.parse(fs.readFileSync(schema.abs, 'utf8'));
    schemaValid = typeof j === 'object' && j !== null;
    const blob = JSON.stringify(j);
    schemaFields = {
      hasLane: /itinerary\.lane|"lane"/.test(blob),
      hasScope: /tenant\.scope|"scope"/.test(blob),
      hasBroker: /broker_agent_id|broker/.test(blob),
    };
  } catch (e) {
    schemaValid = false;
    schemaFields = { parseError: e.message };
  }
}
add(
  'D3',
  'Directive Classification + Governance Schema',
  schemaValid && classif.exists && synth.exists,
  { schema, classif, synth, schemaValid, schemaFields },
  schemaValid ? 'PASS' : 'SCHEMA_INVALID'
);

// D4
const hb = safeStat(
  'docs/protocols/reports/HEARTBEAT_REPORT_cron-heartbeat-ttys011-1784329995324.md'
);
const swarmPath = path.join(os.homedir(), '.tnf', 'swarm-context.md');
let swarm = { exists: fs.existsSync(swarmPath) };
if (swarm.exists) {
  const raw = fs.readFileSync(swarmPath, 'utf8');
  const coh = raw.match(/Coherence:\s*(\d+)/i);
  swarm = {
    exists: true,
    bytes: raw.length,
    coherence: coh ? Number(coh[1]) : null,
    stallHint: /stall/i.test(raw),
    sha256: sha256(raw),
    mtime: fs.statSync(swarmPath).mtime.toISOString(),
  };
}
add(
  'D4',
  'Heartbeat Stall Detection',
  hb.exists && swarm.exists,
  { heartbeatReport: hb, swarm },
  swarm.stallHint ? 'LANE_ROTATE' : 'PASS'
);

// D5 (optional)
const d5 = safeStat(
  'docs/protocols/reports/FEDERATION_ID_ENCODING_AUDIT_2026-06-14.md'
);
add(
  'D5',
  'Federation Identity Audit',
  true, // optional — missing is WARN not fail
  { ...d5, optional: true },
  d5.exists ? 'PASS' : 'WARN_MISSING_OPTIONAL'
);

// D6 — schema dispatch readiness (same schema)
add(
  'D6',
  'Governance Dispatch Enforcement Ready',
  schemaValid && (schemaFields.hasLane || schemaFields.hasScope || schemaFields.hasBroker),
  { schemaValid, schemaFields },
  schemaValid ? 'PASS' : 'REJECT_DISPATCH'
);

// D7
const rate = safeStat(
  'docs/protocols/reports/CURATOR_QUESTION_RATE_LIMIT_GATEWAY_2026-07-08.md'
);
const redisPing = sh('redis-cli ping', 'FAIL');
const clientCount = Number(sh("redis-cli CLIENT LIST 2>/dev/null | wc -l | tr -d ' '", '0')) || 0;
const buildProcs = Number(sh("pgrep -fl build 2>/dev/null | wc -l | tr -d ' '", '0')) || 0;
const overloaded = clientCount > 40 || buildProcs > 20;
add(
  'D7',
  'Curator Rate Limit / Runtime Load',
  rate.exists && redisPing === 'PONG',
  { rate, redisPing, clientCount, buildProcs, overloaded },
  overloaded ? 'ADAPT_CADENCE' : 'PASS'
);

// D8
const d8 = safeStat('docs/protocols/CORE_SYSTEM_PROMPT_ARCHITECTURE.md');
add(
  'D8',
  'Core System Prompt Architecture',
  d8.exists && d8.bytes > 100,
  d8,
  d8.exists ? 'PASS' : 'ROTATE_PROMPT_BLOCKED'
);

// D9
const conc = safeStat(
  'docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md'
);
const res = safeStat('docs/protocols/reports/RESONANCE_ITERATION_21.md');
add(
  'D9',
  'Concurrent Protocol + Resonance',
  conc.exists && res.exists,
  { concurrent: conc, resonance: res, coherence: swarm.coherence },
  conc.exists && res.exists ? 'PASS' : 'FAIL'
);

const requiredOk = checks
  .filter((c) => c.id !== 'D5')
  .every((c) => c.ok);
const report = {
  ok: requiredOk,
  cycleId,
  actor: 'agent:tnf-core',
  hitl: false,
  timestamp: new Date().toISOString(),
  root: ROOT,
  score: `${checks.filter((c) => c.ok).length}/${checks.length}`,
  checks,
  nextActionHint: (() => {
    const gates = checks.map((c) => c.gate).filter(Boolean);
    if (gates.includes('PRIORITIZE_UNBLOCK')) return 'triage_unconverted_directives';
    if (gates.includes('INCLUDE_UNBLOCK_PLAN')) return 'phase7_unblock';
    if (gates.includes('ADAPT_CADENCE')) return 'slow_dispatch';
    if (gates.includes('LANE_ROTATE')) return 'rotate_stalled_lane';
    return 'continue_living_state_directive';
  })(),
};

const outJson = path.join(OUT_DIR, `${cycleId}.json`);
const latest = path.join(OUT_DIR, 'latest.json');
const logLine = path.join(OUT_DIR, 'directive-cycle.log');
fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
fs.writeFileSync(latest, JSON.stringify(report, null, 2));
fs.appendFileSync(
  logLine,
  `${report.timestamp} ${cycleId} ok=${report.ok} score=${report.score} next=${report.nextActionHint}\n`
);

console.log(JSON.stringify({ ok: report.ok, score: report.score, cycleId, latest, nextActionHint: report.nextActionHint }, null, 2));
process.exit(requiredOk ? 0 : 1);
