#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { hydrateStage } = require('./protocols/frontload-manifest.cjs');

const ROOT = process.cwd();
const jsonMode = process.argv.includes('--json');
const checks = [];
function record(name, ok, detail, extra = {}) { checks.push({ name, ok, detail, ...extra }); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

const stageA = hydrateStage({ root: ROOT, stage: 'A', consumer: 'verify-repo-frontload' });
record('stageA.manifest-derived', stageA.ok, stageA.ok ? `${stageA.entries.length} rails loaded and hashed` : 'one or more manifest-derived Stage A rails missing/unreadable', {
  manifestHash: stageA.manifest.sha256,
});
for (const rail of stageA.entries) record(`stageA.${rail.path}`, rail.status === 'loaded', rail.status, { sha256: rail.sha256, bytes: rail.bytes });

const SUPPORTING = [
  'data/harness/onboarding-contract.json',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
  '.agent/skills/tnf-engineering-context/SKILL.md',
  '.skills/tnf-engineering-context/SKILL.md',
  'docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md',
  '.agent/skills/tnf-source-concordance/SKILL.md',
  'scripts/protocols/frontload-manifest.cjs',
  'scripts/protocols/turn-zero-v2-gate.cjs',
  'scripts/tnf-onboard-twip.cjs',
  'scripts/harness/provision-injection-surfaces.cjs',
  'scripts/install-agent-frontload.cjs',
  'CLAUDE.md',
  'AGENTS.md',
  '.cursor/rules/tnf-harness.mdc',
];
for (const rel of SUPPORTING) record(`support.${rel}`, exists(rel), exists(rel) ? 'present' : 'missing');

if (exists('docs/core/BOOTSTRAP.md')) {
  const body = fs.readFileSync(path.join(ROOT, 'docs/core/BOOTSTRAP.md'), 'utf8');
  const state = body.includes('[BOOTSTRAP_STATUS:COMPLETE]') ? 'COMPLETE' : body.includes('[BOOTSTRAP_STATUS:PENDING]') ? 'PENDING' : 'UNKNOWN';
  record('bootstrap.status-marker', state !== 'UNKNOWN', state);
}

const failed = checks.filter((c) => !c.ok);
const out = {
  ok: failed.length === 0,
  authority: 'docs/core/FRONTLOAD_MANIFEST.md',
  manifestHash: stageA.manifest.sha256,
  stageARails: stageA.entries.map((x) => ({ path: x.path, status: x.status, sha256: x.sha256 })),
  failed: failed.length,
  checks,
};
if (jsonMode) console.log(JSON.stringify(out, null, 2));
else {
  console.log('TNF repo frontload verification — manifest-derived');
  for (const c of checks) console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.name} — ${c.detail}`);
  console.log(out.ok ? '\nFRONTLOAD CONTRACT PASS' : `\n${failed.length} check(s) failed`);
}
process.exit(out.ok ? 0 : 1);
