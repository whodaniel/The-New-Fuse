#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=pre-push';
const mode = modeArg.split('=')[1] || 'pre-push';
const now = Date.now();

const HANDOFF_JSON = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const HANDOFF_MD = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';
const STATUS_LEDGER = 'docs/protocols/AGENT_STATUS_LEDGER.md';
const HANDOFF_SCHEMA = 'docs/protocols/schemas/tnf-session-handoff.schema.json';

const requiredArtifacts = [HANDOFF_JSON, HANDOFF_MD, STATUS_LEDGER];

const criticalPathPatterns = [
  /^apps\//i,
  /^packages\//i,
  /^supabase\//i,
  /^scripts\//i,
  /^data\//i,
  /^docs\/protocols\//i,
  /^\.github\/workflows\//i,
];

const supabaseSensitivePatterns = [
  /^supabase\//i,
  /^apps\/virtual-library-blueprints\/supabase\//i,
  /^apps\/api\/supabase\//i,
];

const excludedFromCritical = new Set(
  [
    HANDOFF_JSON,
    HANDOFF_MD,
    STATUS_LEDGER,
    HANDOFF_SCHEMA,
    'docs/protocols/SESSION_HANDOFF_TEMPLATE.md',
    'scripts/protocols/enforce-session-handoff.cjs',
    'scripts/protocols/emit-session-handoff.cjs',
  ].map((entry) => normalizePath(entry).toLowerCase()),
);

function normalizePath(input) {
  return String(input || '').replace(/\\/g, '/').trim();
}

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
    ...options,
  }).trim();
}

function runGit(argsList) {
  return execFileSync('git', argsList, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
  }).trim();
}

function getFilesForMode(activeMode) {
  const explicit = process.env.TNF_HANDOFF_FILE_LIST || process.env.PRIVACY_GUARD_FILE_LIST;
  if (explicit && fs.existsSync(explicit)) {
    return fs
      .readFileSync(explicit, 'utf8')
      .split('\n')
      .map((line) => normalizePath(line))
      .filter(Boolean);
  }

  if (activeMode === 'staged') {
    const out = run('git diff --cached --name-only --diff-filter=ACMR');
    return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
  }

  if (activeMode === 'pre-push') {
    try {
      const out = run('git diff --name-only --diff-filter=ACMR @{u}..HEAD');
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    } catch {
      const out = run('git diff --name-only --diff-filter=ACMR HEAD~1..HEAD');
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    }
  }

  if (activeMode === 'ci') {
    try {
      const out = run('git diff --name-only --diff-filter=ACMR HEAD~1..HEAD');
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  if (activeMode === 'repo') {
    const out = run('git ls-files');
    return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
  }

  throw new Error(`Unsupported mode: ${activeMode}`);
}

function isCriticalPath(filePath) {
  const normalized = normalizePath(filePath).toLowerCase();
  if (!normalized) return false;
  if (excludedFromCritical.has(normalized)) return false;
  return criticalPathPatterns.some((pattern) => pattern.test(normalized));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`[session-handoff-gate] BLOCKED (${mode}): ${message}`);
  process.exit(1);
}

function validateSchemaAndPayload(handoffFilePath, schemaFilePath) {
  if (!fs.existsSync(schemaFilePath)) fail(`Missing schema: ${schemaFilePath}`);
  if (!fs.existsSync(handoffFilePath)) fail(`Missing handoff JSON: ${handoffFilePath}`);

  let schema;
  let handoff;
  try {
    schema = readJson(schemaFilePath);
  } catch (error) {
    fail(`Invalid schema JSON (${schemaFilePath}): ${error.message}`);
  }
  try {
    handoff = readJson(handoffFilePath);
  } catch (error) {
    fail(`Invalid handoff JSON (${handoffFilePath}): ${error.message}`);
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(handoff)) {
    const details = (validate.errors || [])
      .slice(0, 20)
      .map((err) => `${err.instancePath || '/'} ${err.message}`)
      .join('; ');
    fail(`Handoff JSON failed schema validation: ${details}`);
  }

  return handoff;
}

function ensureFreshHandoff(handoff) {
  const createdAtMs = Date.parse(String(handoff.created_at || ''));
  if (Number.isNaN(createdAtMs)) {
    fail('Handoff created_at is not parseable as date-time.');
  }
  const ageMs = now - createdAtMs;
  const maxAgeMs = 1000 * 60 * 60 * 72;
  if (ageMs < 0) {
    fail('Handoff created_at is in the future.');
  }
  if (ageMs > maxAgeMs) {
    fail('Handoff created_at is older than 72 hours. Emit a fresh handoff.');
  }
}

function ensureHandoffCoverage(handoff, criticalFiles) {
  const declaredPaths = new Set(
    (Array.isArray(handoff.changed_paths) ? handoff.changed_paths : [])
      .map((entry) => normalizePath(entry).toLowerCase())
      .filter(Boolean),
  );
  const missingCoverage = criticalFiles.filter((file) => !declaredPaths.has(file.toLowerCase()));
  if (missingCoverage.length) {
    fail(
      `Handoff changed_paths does not cover critical changed files: ${missingCoverage
        .slice(0, 15)
        .join(', ')}`,
    );
  }
}

function ensureSupabaseAuditCoverage(handoff, changedFiles) {
  const touchesSupabase = changedFiles.some((file) =>
    supabaseSensitivePatterns.some((pattern) => pattern.test(normalizePath(file))),
  );
  if (!touchesSupabase) return;

  const supabaseAuditState = handoff?.verification?.supabase_rls_audit;
  if (supabaseAuditState !== 'pass') {
    fail(
      'Supabase-sensitive changes require verification.supabase_rls_audit to be "pass". Run the strict RLS audit before emitting handoff artifacts.',
    );
  }
}

function ensureMarkdownAck(mdPath) {
  if (!fs.existsSync(mdPath)) fail(`Missing handoff markdown: ${mdPath}`);
  const content = fs.readFileSync(mdPath, 'utf8');
  if (!content.includes('TNF_PROTOCOL_ACK')) {
    fail('SESSION_HANDOFF_LATEST.md missing TNF_PROTOCOL_ACK marker.');
  }
  if (!content.toLowerCase().includes('next actions')) {
    fail('SESSION_HANDOFF_LATEST.md missing "Next Actions" section.');
  }
}

function main() {
  const files = getFilesForMode(mode).map(normalizePath).filter(Boolean);
  if (!files.length) {
    console.log(`[session-handoff-gate] OK (${mode}): no files to inspect`);
    return;
  }

  const criticalFiles = files.filter((file) => isCriticalPath(file));
  if (!criticalFiles.length) {
    console.log(`[session-handoff-gate] OK (${mode}): no critical-path changes detected`);
    return;
  }

  const changedSet = new Set(files.map((file) => normalizePath(file).toLowerCase()));
  const missingArtifacts = requiredArtifacts.filter(
    (file) => !changedSet.has(normalizePath(file).toLowerCase()),
  );
  if (missingArtifacts.length) {
    fail(
      `Critical-path changes require fresh handoff artifacts. Missing in this change set: ${missingArtifacts.join(
        ', ',
      )}`,
    );
  }

  const handoff = validateSchemaAndPayload(HANDOFF_JSON, HANDOFF_SCHEMA);
  ensureFreshHandoff(handoff);
  ensureHandoffCoverage(handoff, criticalFiles);
  ensureSupabaseAuditCoverage(handoff, files);
  ensureMarkdownAck(HANDOFF_MD);

  if (!fs.existsSync(STATUS_LEDGER)) {
    fail(`Missing status ledger file: ${STATUS_LEDGER}`);
  }

  console.log(
    `[session-handoff-gate] OK (${mode}): protocol artifacts present, fresh, schema-valid, and coverage-complete`,
  );
}

main();
