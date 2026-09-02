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
  
  // Ignore build/test outputs, node_modules, and logs
  if (
    normalized.includes('/node_modules/') ||
    normalized.includes('/dist/') ||
    normalized.endsWith('.log') ||
    normalized.endsWith('.tsbuildinfo') ||
    normalized.endsWith('.map') ||
    normalized.endsWith('results.json')
  ) {
    return false;
  }

  return criticalPathPatterns.some((pattern) => pattern.test(normalized));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Report a failing verdict at the enforcement level the CALLER declared.
 *
 * This gate always exits 1 — that is its verdict, and callers rely on it. But
 * whether that verdict stops anything is the caller's decision, and this gate
 * cannot see it. `.husky/pre-push` wraps this invocation in `run_warn`, which
 * catches the non-zero exit and continues, while the privacy, secret and PII
 * guards beside it are unwrapped and genuinely block.
 *
 * So every push printed "BLOCKED (pre-push)" and then pushed. The hook does
 * disclose the override on the following line, but "BLOCKED" leads, and it is
 * the word anyone greping logs or skimming CI output will find. A verdict that
 * names an outcome it did not produce is the same defect this repo keeps
 * finding, just pointed at the operator instead of at a machine.
 *
 * `--advisory` lets the caller state that it will not enforce, so the wording
 * matches reality. The exit code is unchanged either way.
 */
const ADVISORY = args.includes('--advisory');

function fail(message) {
  const verdict = ADVISORY ? 'ADVISORY (not enforced by caller)' : 'BLOCKED';
  console.error(`[session-handoff-gate] ${verdict} (${mode}): ${message}`);
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
    fail(`Markdown receipt missing TNF_PROTOCOL_ACK marker: ${mdPath}`);
  }
  if (!content.toLowerCase().includes('next actions')) {
    fail(`Markdown receipt missing "Next Actions" section: ${mdPath}`);
  }
}


function ensureReceiptBinding(handoff, mode, receiptJsonPath) {
  // Mode-specific execution semantic definitions
  // staged: Strict Git evidence. Branch = symbolic-ref, Origin = remote.origin.url, Basis = HEAD
  // pre-push: Upstream/remote evidence (often detached HEAD if run by specific wrappers). Uses current origin, skip branch if detached.
  // ci: Authenticated/provider-supplied ref/base/head information where available.

  let activeBranch;
  try {
    activeBranch = run('git symbolic-ref --short HEAD');
  } catch {
    // detached head
  }
  
  if (activeBranch) {
    if (handoff.branch && handoff.branch !== activeBranch) {
      fail(`Receipt branch binding mismatch. Receipt declares '${handoff.branch}', but active branch is '${activeBranch}'.`);
    }
  } else if (mode === 'ci') {
    // CI environments might pass GitHub variables, but we fall back to NOT APPLICABLE if absent.
    const ciBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
    if (ciBranch && handoff.branch && handoff.branch !== ciBranch) {
      fail(`Receipt branch binding mismatch in CI. Receipt declares '${handoff.branch}', but CI branch is '${ciBranch}'.`);
    }
  }

  // Repository context binding
  let gitOrigin = '';
  try {
    gitOrigin = run('git config --get remote.origin.url');
  } catch {
    fail('Could not determine git repository origin. Directory may not be a valid git clone.');
  }

  const normalizeOrigin = (url) => {
    if (!url) return '';
    let norm = url.replace(/^https?:\/\/github\.com\//, '');
    norm = norm.replace(/^git@github\.com:/, '');
    return norm.replace(/\.git$/, '').trim();
  };

  const actualOriginNorm = normalizeOrigin(gitOrigin);
  const declaredOriginNorm = normalizeOrigin(handoff.repository);
  const declaredCtxOriginNorm = handoff.repository_context && handoff.repository_context.origin ? normalizeOrigin(handoff.repository_context.origin) : declaredOriginNorm;

  if (actualOriginNorm !== declaredOriginNorm) {
    fail(`Receipt repository binding mismatch. Receipt declares '${handoff.repository}', but git origin is '${gitOrigin}'.`);
  }

  // Basis HEAD binding
  // Contract: receipt.head_sha means "HEAD immediately before this commit". 
  // For 'staged' mode, git rev-parse HEAD precisely resolves this.
  if (mode === 'staged' && handoff.head_sha) {
    const expectedBasisSha = run('git rev-parse HEAD');
    if (handoff.head_sha !== expectedBasisSha && !expectedBasisSha.startsWith(handoff.head_sha)) {
      fail(`Receipt basis HEAD binding mismatch. Receipt declares basis '${handoff.head_sha}', but current basis HEAD is '${expectedBasisSha}'.`);
    }
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
  // STATUS_LEDGER is "satisfied" if EITHER the change set includes it OR
  // the ledger at HEAD already references the handoff_id currently on disk
  // (i.e. the ledger is consistent with the handoff even though no new row
  // was added in this commit). This class-level fix prevents a noisy push
  // gate when work has been ratified by the prior committed handoff.
  let ledgerSatisfied = changedSet.has(STATUS_LEDGER.toLowerCase());
  if (!ledgerSatisfied && fs.existsSync(HANDOFF_JSON)) {
    try {
      const handoff = JSON.parse(fs.readFileSync(HANDOFF_JSON, 'utf8'));
      const hid = handoff && handoff.handoff_id;
      // Read ledger at HEAD via git to avoid contention with unstaged edits
      let ledgerAtHead;
      try {
        ledgerAtHead = run(`git show HEAD:${STATUS_LEDGER}`);
      } catch {
        // ledger doesn't exist at HEAD (first-ever run) — leave unsatisfied
      }
      if (hid && ledgerAtHead && ledgerAtHead.includes(hid)) {
        ledgerSatisfied = true;
      }
    } catch {
      // ignore parse errors; leave ledgerSatisfied=false to keep gate strict
    }
  }
  // Find all handoff receipts in the change set. changedSet is lower-cased,
  // so the global SESSION_HANDOFF_LATEST.json ALSO matches the session_handoff_
  // filter below. A per-agent receipt plus a co-staged LATEST (the normal
  // turn-end shape) must NOT be treated as ambiguity — prefer the per-agent
  // receipt and ignore the co-staged LATEST. Only two or more per-agent
  // receipts is genuine ambiguity.
  const globalLatestLower = HANDOFF_JSON.toLowerCase();
  const scopedJsonCandidates = Array.from(changedSet).filter(f => f.startsWith('docs/protocols/reports/session_handoff_') && f.endsWith('.json'));
  const perAgentReceipts = scopedJsonCandidates.filter(f => f !== globalLatestLower);

  if (perAgentReceipts.length > 1) {
    fail('Multiple per-agent handoff JSON receipts found in this change set. Only one receipt per agent per commit is permitted to prevent ambiguity.');
  }

  let receiptJsonPath;
  if (perAgentReceipts.length === 1) {
    // Per-agent receipt wins; a co-staged global LATEST is ignored.
    receiptJsonPath = perAgentReceipts[0];
  } else if (scopedJsonCandidates.length === 1) {
    // Only the global LATEST is present — global semantics apply.
    receiptJsonPath = scopedJsonCandidates[0];
  } else {
    fail('Critical-path changes require a valid scoped handoff receipt. No docs/protocols/reports/SESSION_HANDOFF_*.json found in this change set.');
  }
  const receiptBase = receiptJsonPath.slice(0, -5);
  const receiptMdPath = receiptBase + '.md';

  if (!changedSet.has(receiptMdPath)) {
    fail(`Critical-path changes require fresh handoff artifacts. Missing matching markdown receipt in this change set: ${receiptMdPath}`);
  }

  const isGlobalLatest = receiptJsonPath === HANDOFF_JSON.toLowerCase();

  if (isGlobalLatest) {
    const missingGlobal = [];
    if (!ledgerSatisfied) missingGlobal.push(STATUS_LEDGER);
    if (missingGlobal.length) {
      fail(`Global LATEST handoff update requires fresh status ledger. Missing in this change set: ${missingGlobal.join(', ')}`);
    }
  }

  // Find original casing for file reads
  const actualJsonPath = files.find(f => normalizePath(f).toLowerCase() === receiptJsonPath) || receiptJsonPath;
  const actualMdPath = files.find(f => normalizePath(f).toLowerCase() === receiptMdPath) || receiptMdPath;

  const handoff = validateSchemaAndPayload(actualJsonPath, HANDOFF_SCHEMA);
  ensureFreshHandoff(handoff);
  ensureHandoffCoverage(handoff, criticalFiles);
  ensureSupabaseAuditCoverage(handoff, files);
  ensureMarkdownAck(actualMdPath);
  ensureReceiptBinding(handoff, mode, actualJsonPath);

  if (isGlobalLatest && !fs.existsSync(STATUS_LEDGER)) {
    fail(`Missing status ledger file: ${STATUS_LEDGER}`);
  }

  console.log(
    `[session-handoff-gate] OK (${mode}): protocol artifacts present, fresh, schema-valid, and coverage-complete`,
  );
}

main();
