#!/usr/bin/env node
/**
 * Verify the TNF OPEN-RUNTIME frontload rail.
 *
 * The public distribution must not depend on private/internal-only prompt or
 * state surfaces. Required files are declared by data/harness/open-agent-contract.json.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const CONTRACT = path.join(ROOT, 'data/harness/open-agent-contract.json');
const jsonMode = process.argv.includes('--json');
const checks = [];

function record(name, ok, detail, required = true) {
  checks.push({ name, ok, detail, required });
}

let contract = null;
if (!fs.existsSync(CONTRACT)) {
  record('open-agent-contract', false, 'data/harness/open-agent-contract.json missing');
} else {
  try {
    contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
    record('open-agent-contract', true, contract.spec || 'loaded');
  } catch (error) {
    record('open-agent-contract', false, `invalid JSON: ${error.message}`);
  }
}

for (const rel of contract?.requiredRails || []) {
  const abs = path.join(ROOT, rel);
  const ok = fs.existsSync(abs) && fs.statSync(abs).isFile();
  record(rel, ok, ok ? 'present' : 'missing');
}

// Continuation projections improve orientation but are not the semantic root.
for (const rel of [
  'docs/protocols/LIVING_STATE.md',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
  '.agent/context/resource-map.md',
  'docs/core/SECURITY.md',
  'docs/core/ENGINEERING_PRINCIPLES.md',
]) {
  const abs = path.join(ROOT, rel);
  const ok = fs.existsSync(abs);
  record(rel, ok, ok ? 'present' : 'optional projection missing', false);
}

const railGate = path.join(ROOT, 'scripts/protocols/open-agent-rail-gate.cjs');
if (!fs.existsSync(railGate)) {
  record('open-agent-rail-gate', false, 'gate script missing');
} else {
  const result = spawnSync(process.execPath, [railGate, '--no-write', '--quiet'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  record(
    'open-agent-rail-gate',
    result.status === 0,
    result.status === 0 ? 'PASS' : `exit ${result.status}: ${String(result.stderr || result.stdout || '').trim().slice(0, 300)}`
  );
}

const failedRequired = checks.filter((c) => c.required && !c.ok);
const ok = failedRequired.length === 0;

if (jsonMode) {
  console.log(JSON.stringify({ ok, failedRequired: failedRequired.length, checks }, null, 2));
} else {
  console.log('TNF open-runtime frontload verification');
  for (const c of checks) {
    const mark = c.ok ? 'OK' : c.required ? 'FAIL' : 'WARN';
    console.log(`${mark}: ${c.name} — ${c.detail}`);
  }
  console.log(ok ? '\nOPEN RUNTIME FRONTLOAD: PASS' : `\nOPEN RUNTIME FRONTLOAD: FAIL (${failedRequired.length} required)`);
}

process.exit(ok ? 0 : 1);
