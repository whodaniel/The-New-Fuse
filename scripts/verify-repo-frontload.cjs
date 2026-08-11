#!/usr/bin/env node
/**
 * Verify repo-local TNF frontload artifacts against FRONTLOAD_MANIFEST.md.
 * Shell/home frontload markers remain scripts/verify_frontload_state.sh.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'docs/core/FRONTLOAD_MANIFEST.md');

const REQUIRED = [
  'docs/protocols/TURN_ZERO_MANDATE.md',
  'docs/protocols/LIVING_STATE.md',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
  '.agent/SYSTEM_PROMPT.md',
  'docs/protocols/AGENT_STATUS_LEDGER.md',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
  '.agent/context/resource-map.md',
  'docs/core/SOUL.md',
  'docs/core/IDENTITY.md',
  'docs/core/USER.md',
  'docs/core/TOOLS.md',
  'docs/core/HEARTBEAT.md',
  'docs/core/SECURITY.md',
  'docs/core/MEMORY.md',
  'docs/core/ENGINEERING_PRINCIPLES.md',
  'docs/core/BOOTSTRAP.md',
  'docs/core/FRONTLOAD_MANIFEST.md',
  'docs/core/AGENTS.md',
  'docs/protocols/HARNESS_CONFIG.md',
  'docs/protocols/HARNESS_MEMORY_LAYER.md',
  'docs/protocols/HARNESS_TRAJECTORY.md',
  'docs/protocols/HARNESS_PERMISSION_BERM.md',
  'data/harness/harness-config.json',
  'data/harness/permission-policy.json',
  'data/mcp_config.json',
];

const jsonMode = process.argv.includes('--json');
const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
}

if (!fs.existsSync(MANIFEST)) {
  record('manifest', false, 'docs/core/FRONTLOAD_MANIFEST.md missing');
} else {
  record('manifest', true, 'FRONTLOAD_MANIFEST.md present');
}

for (const rel of REQUIRED) {
  const abs = path.join(ROOT, rel);
  const ok = fs.existsSync(abs);
  record(rel, ok, ok ? 'present' : 'missing');
}

const bootstrapPath = path.join(ROOT, 'docs/core/BOOTSTRAP.md');
if (fs.existsSync(bootstrapPath)) {
  const body = fs.readFileSync(bootstrapPath, 'utf8');
  const pending = body.includes('[BOOTSTRAP_STATUS:PENDING]');
  const complete = body.includes('[BOOTSTRAP_STATUS:COMPLETE]');
  record(
    'bootstrap_status',
    pending || complete,
    pending ? 'PENDING' : complete ? 'COMPLETE' : 'missing status marker'
  );
}

const failed = checks.filter((c) => !c.ok);
const ok = failed.length === 0;

if (jsonMode) {
  console.log(JSON.stringify({ ok, failed: failed.length, checks }, null, 2));
} else {
  console.log('TNF repo frontload verification');
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.name} — ${c.detail}`);
  }
  console.log(ok ? '\nALL REQUIRED FRONTLOAD ARTIFACTS PRESENT' : `\n${failed.length} missing/failed`);
}

process.exit(ok ? 0 : 1);
