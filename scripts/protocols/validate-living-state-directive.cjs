#!/usr/bin/env node
/**
 * A5 — Enforce fenced Current Directive + tip-align honesty on Living State.
 *
 * Usage: node scripts/protocols/validate-living-state-directive.cjs [--mode=ci|warn]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const modeArg = process.argv.find((a) => a.startsWith('--mode=')) || '--mode=ci';
const mode = modeArg.split('=')[1] || 'ci';
const warnOnly = mode === 'warn' || process.argv.includes('--mode=warn');

const repoRoot = process.env.TNF_REPO_ROOT || process.cwd();
const livingPath = path.join(repoRoot, 'docs/protocols/LIVING_STATE.md');
const handoffPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');

const START = '<!-- CURRENT_DIRECTIVE:START -->';
const END = '<!-- CURRENT_DIRECTIVE:END -->';

function fail(msg) {
  console.error(`[living-state-directive] BLOCKED (${mode}): ${msg}`);
  if (warnOnly) {
    console.warn('[living-state-directive] warn-only — not exiting non-zero');
    process.exit(0);
  }
  process.exit(1);
}

function ok(msg) {
  console.log(`[living-state-directive] OK (${mode}): ${msg}`);
}

if (!fs.existsSync(livingPath)) {
  fail(`missing ${path.relative(repoRoot, livingPath)}`);
}

const content = fs.readFileSync(livingPath, 'utf8');
const startCount = (content.match(/<!--\s*CURRENT_DIRECTIVE:START\s*-->/g) || []).length;
const endCount = (content.match(/<!--\s*CURRENT_DIRECTIVE:END\s*-->/g) || []).length;

if (startCount !== 1 || endCount !== 1) {
  fail(`expected exactly one CURRENT_DIRECTIVE fence pair (start=${startCount} end=${endCount})`);
}

const fenceRe =
  /<!--\s*CURRENT_DIRECTIVE:START\s*-->\s*([\s\S]*?)\s*<!--\s*CURRENT_DIRECTIVE:END\s*-->/;
const m = content.match(fenceRe);
if (!m) {
  fail('could not parse CURRENT_DIRECTIVE fence body');
}

const body = String(m[1] || '').trim();
if (!body) {
  fail('Current Directive fence is empty');
}
if (body.split('\n').filter((l) => l.trim()).length > 3) {
  fail('Current Directive fence must be a short slot (≤3 non-empty lines)');
}
if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(body)) {
  fail('Current Directive fence must not contain UUID handoff sludge');
}

const hasSync = content.includes('[STATUS:SYNCHRONIZED]');
const hasDrift = content.includes('[STATUS:DRIFT]');

let head = '';
try {
  head = execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  head = '';
}

let handoffSha = '';
try {
  const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
  handoffSha = String(handoff.head_sha || handoff.headSha || '');
} catch {
  handoffSha = '';
}

const tipAligned = Boolean(
  head &&
    handoffSha &&
    (head === handoffSha || head.startsWith(handoffSha) || handoffSha.startsWith(head.slice(0, 12)))
);

if (hasSync && hasDrift) {
  fail('Living State cannot claim both STATUS:SYNCHRONIZED and STATUS:DRIFT');
}

if (hasSync && head && handoffSha && !tipAligned) {
  fail(
    `STATUS:SYNCHRONIZED but tip drift (HEAD=${head.slice(0, 12)} handoff=${handoffSha.slice(0, 12)})`
  );
}

if (!hasSync && !hasDrift) {
  fail('Living State missing STATUS:SYNCHRONIZED or STATUS:DRIFT');
}

ok(
  `fence ok; status=${hasSync ? 'SYNCHRONIZED' : 'DRIFT'}; tipAligned=${tipAligned ? 'yes' : 'no'}`
);
process.exit(0);
