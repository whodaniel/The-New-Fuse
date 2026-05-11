#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=local';
const mode = modeArg.split('=')[1] || 'local';

const repoRoot = process.cwd();
const canonicalJsonRel = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const canonicalMdRel = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';
const canonicalJsonPath = path.join(repoRoot, canonicalJsonRel);
const canonicalMdPath = path.join(repoRoot, canonicalMdRel);

const legacyPointerPath =
  process.env.TNF_LEGACY_HANDOFF_POINTER_PATH ||
  path.join(os.homedir(), '.openclaw', 'workspace', 'handoff', 'LATEST.md');
const requireLegacyPointer = process.env.TNF_REQUIRE_LEGACY_HANDOFF_POINTER === '1';

function fail(message) {
  console.error(`[handoff-source-drift] BLOCKED (${mode}): ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[handoff-source-drift] WARN (${mode}): ${message}`);
}

function ok(message) {
  console.log(`[handoff-source-drift] OK (${mode}): ${message}`);
}

if (!fs.existsSync(canonicalJsonPath)) {
  fail(`canonical handoff JSON missing: ${canonicalJsonRel}`);
}
if (!fs.existsSync(canonicalMdPath)) {
  fail(`canonical handoff markdown missing: ${canonicalMdRel}`);
}

let handoffJson;
try {
  handoffJson = JSON.parse(fs.readFileSync(canonicalJsonPath, 'utf8'));
} catch (error) {
  fail(`canonical handoff JSON is invalid (${canonicalJsonRel}): ${error.message}`);
}

if (!handoffJson || typeof handoffJson !== 'object' || Array.isArray(handoffJson)) {
  fail(`canonical handoff JSON root must be an object: ${canonicalJsonRel}`);
}
if (!handoffJson.handoff_id || typeof handoffJson.handoff_id !== 'string') {
  fail(`canonical handoff JSON missing handoff_id: ${canonicalJsonRel}`);
}

const markdown = fs.readFileSync(canonicalMdPath, 'utf8');
if (!markdown.includes('TNF_PROTOCOL_ACK')) {
  fail(`canonical handoff markdown missing TNF_PROTOCOL_ACK: ${canonicalMdRel}`);
}
if (!markdown.includes(handoffJson.handoff_id)) {
  fail(
    `handoff_id mismatch: ${canonicalMdRel} does not reference ${handoffJson.handoff_id} from ${canonicalJsonRel}`,
  );
}

if (!fs.existsSync(legacyPointerPath)) {
  if (requireLegacyPointer) {
    fail(`legacy pointer missing (required): ${legacyPointerPath}`);
  }
  warn(`legacy pointer not present; skipping pointer consistency check: ${legacyPointerPath}`);
  ok('canonical source verified');
  process.exit(0);
}

let legacyStat;
try {
  legacyStat = fs.lstatSync(legacyPointerPath);
} catch (error) {
  fail(`unable to stat legacy pointer (${legacyPointerPath}): ${error.message}`);
}

if (!legacyStat.isSymbolicLink()) {
  fail(`legacy pointer exists but is not a symlink: ${legacyPointerPath}`);
}

let rawTarget;
try {
  rawTarget = fs.readlinkSync(legacyPointerPath);
} catch (error) {
  fail(`unable to read legacy pointer target (${legacyPointerPath}): ${error.message}`);
}

const resolvedTarget = path.resolve(path.dirname(legacyPointerPath), rawTarget);
if (!fs.existsSync(resolvedTarget)) {
  fail(`legacy pointer target does not exist: ${legacyPointerPath} -> ${rawTarget}`);
}

let expectedRealPath;
let actualRealPath;
try {
  expectedRealPath = fs.realpathSync(canonicalMdPath);
  actualRealPath = fs.realpathSync(resolvedTarget);
} catch (error) {
  fail(`unable to resolve canonical or legacy pointer realpath: ${error.message}`);
}

if (expectedRealPath !== actualRealPath) {
  fail(
    `legacy pointer mismatch: ${legacyPointerPath} -> ${actualRealPath} (expected ${expectedRealPath})`,
  );
}

ok('canonical source verified and legacy pointer aligned');
