#!/usr/bin/env node
/**
 * Progressive autonomy levels — capability is gated by proven substrate health.
 *
 * level 0: observe / help only (always)
 * level 1: requires substrate hard failures == 0 (CLI dists + lock + not quarantined)
 * level 2: level 1 + Redis soft OK + no escalation halt
 * level 3: level 2 + install seal present + TNF_GATE_POLICY_TOKEN set
 *
 * Usage:
 *   node scripts/protocols/validate-progressive-autonomy.cjs [--level N] [--json] [--set-level N]
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LEVEL_PATH = path.join(REPO_ROOT, 'docs/operations/tnf-autonomy-level.json');
const ESCALATION_PATH = path.join(REPO_ROOT, 'docs/operations/tnf-escalation-state.json');

function isTruthy(v) {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function runSubstrate() {
  const script = path.join(__dirname, 'validate-substrate-attestation.cjs');
  const result = spawnSync(process.execPath, [script, '--mode=warn', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: process.env,
    timeout: 20_000,
  });
  try {
    const out = (result.stdout || '').trim();
    const i = out.indexOf('{');
    return i >= 0 ? JSON.parse(out.slice(i)) : { ok: false, hardFailures: 1, softFailures: 0, checks: [] };
  } catch {
    return { ok: false, hardFailures: 1, softFailures: 0, checks: [] };
  }
}

function evaluate(requestedLevel) {
  const substrate = runSubstrate();
  const byId = Object.fromEntries((substrate.checks || []).map((c) => [c.id, c]));
  const escalation = readJson(ESCALATION_PATH, { halted: false });
  const hard = substrate.hardFailures || 0;
  const redisOk = Boolean(byId.redis?.ok);
  const sealOk = Boolean(byId['install-seal']?.ok) && !(byId['install-seal']?.detail || '').includes('absent');
  const tokenOk = Boolean(byId['gate-policy-token']?.ok);
  const quarantined = (byId['full-auto-quarantine']?.detail || '').includes('quarantined');

  const reasons = [];
  let maxAllowed = 0;
  if (hard === 0 && !quarantined) maxAllowed = 1;
  else reasons.push(`level1 blocked: hard=${hard} quarantined=${quarantined}`);

  if (maxAllowed >= 1 && redisOk && !escalation.halted) maxAllowed = 2;
  else if (requestedLevel >= 2) reasons.push(`level2 blocked: redisOk=${redisOk} halted=${Boolean(escalation.halted)}`);

  if (maxAllowed >= 2 && sealOk && tokenOk) maxAllowed = 3;
  else if (requestedLevel >= 3) reasons.push(`level3 blocked: sealOk=${sealOk} tokenOk=${tokenOk}`);

  return {
    schema: 'tnf/progressive-autonomy/0.1',
    timestamp: new Date().toISOString(),
    requestedLevel,
    maxAllowed,
    ok: requestedLevel <= maxAllowed,
    reasons,
    substrateHardFailures: hard,
    redisOk,
    sealOk,
    tokenOk,
    escalationHalted: Boolean(escalation.halted),
    quarantined,
  };
}

function parseArgs(argv) {
  let level = null;
  let setLevel = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a.startsWith('--level=')) level = Number(a.slice('--level='.length));
    else if (a === '--level') level = Number(argv[++i]);
    else if (a.startsWith('--set-level=')) setLevel = Number(a.slice('--set-level='.length));
    else if (a === '--set-level') setLevel = Number(argv[++i]);
  }
  const stored = readJson(LEVEL_PATH, { level: 0 });
  if (level == null || Number.isNaN(level)) level = Number(stored.level || 0);
  return { level, setLevel, json };
}

function main() {
  if (isTruthy(process.env.TNF_SKIP_AUTONOMY_GATE)) {
    console.log('[autonomy] SKIP (TNF_SKIP_AUTONOMY_GATE=1)');
    process.exit(0);
  }
  const opts = parseArgs(process.argv.slice(2));
  const result = evaluate(opts.level);

  if (opts.setLevel != null && !Number.isNaN(opts.setLevel)) {
    const probe = evaluate(opts.setLevel);
    if (!probe.ok) {
      console.error(`[autonomy] cannot set level=${opts.setLevel}; maxAllowed=${probe.maxAllowed}`);
      console.error(probe.reasons.join('\n'));
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(LEVEL_PATH), { recursive: true });
    fs.writeFileSync(
      LEVEL_PATH,
      `${JSON.stringify({ schema: 'tnf/autonomy-level/0.1', level: opts.setLevel, updatedAt: new Date().toISOString() }, null, 2)}\n`
    );
    console.log(`[autonomy] set level=${opts.setLevel}`);
  }

  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(
      `[autonomy] requested=${result.requestedLevel} maxAllowed=${result.maxAllowed} ok=${result.ok}`
    );
    for (const r of result.reasons) console.log(`[autonomy] ${r}`);
  }

  process.exit(result.ok ? 0 : 1);
}

main();
