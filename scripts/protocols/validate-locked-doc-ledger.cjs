#!/usr/bin/env node
/* eslint-disable no-console */

// Enforces Gate 5 of docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md
// ("The Challenge & Verify Step"): any body change to a [STATUS:LOCKED]-class
// governance doc must be accompanied by a matching, freshly-added entry in
// docs/protocols/CHALLENGE_RATIONALE_LOG.md. Sibling to
// scripts/protocols/validate-doc-tagging.cjs (which only checks header-tag
// shape, never body content) — kept separate so that script stays
// single-purpose.
//
// Usage:
//   node scripts/protocols/validate-locked-doc-ledger.cjs --mode=staged
//   node scripts/protocols/validate-locked-doc-ledger.cjs --mode=ci [--base=<ref>]

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=staged';
const mode = modeArg.split('=')[1] || 'staged';
const baseArg = args.find((arg) => arg.startsWith('--base='));
const baseRef = baseArg ? baseArg.split('=')[1] : process.env.TNF_LOCKED_DOC_LEDGER_BASE_REF || 'origin/main';

const repoRoot = process.cwd();
const LEDGER_REL = 'docs/protocols/CHALLENGE_RATIONALE_LOG.md';

const LEDGER_PROTECTED_FILES = [
  'docs/protocols/DIRECTIVES.md',
  'docs/protocols/TURN_ZERO_MANDATE.md',
];

function fail(message) {
  console.error(`[locked-doc-ledger] BLOCKED (${mode}): ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`[locked-doc-ledger] OK (${mode}): ${message}`);
}

function gitShow(ref, relPath) {
  try {
    // stdio pipes stderr too, so a missing-path "fatal:" from git (expected
    // and harmless for newly-added files) doesn't leak into script output.
    return execFileSync('git', ['show', `${ref}:${relPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (_error) {
    return null; // file doesn't exist at that ref (e.g. newly added)
  }
}

function gitShowStaged(relPath) {
  try {
    return execFileSync('git', ['show', `:${relPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (_error) {
    return null; // not staged (e.g. untracked, or unchanged since HEAD)
  }
}

function readWorkingTree(relPath) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf8');
}

// "base" = last-committed version to diff against.
// "current" = the version about to land (staged index in staged mode,
// working tree in ci mode, since a CI checkout of a PR/push IS the
// candidate state).
function getCurrent(relPath) {
  if (mode === 'staged') {
    return gitShowStaged(relPath) || readWorkingTree(relPath);
  }
  return readWorkingTree(relPath);
}

function getBase(relPath) {
  if (mode === 'staged') {
    return gitShow('HEAD', relPath);
  }
  return gitShow(baseRef, relPath);
}

// Strip any line containing a `[KEY:VALUE]`-style header tag (same shape
// validate-doc-tagging.cjs parses) — header-tag transitions (e.g. STATUS
// flips) are a separate governance concern (Gate 3), not gated here. Only
// the document body is gated by Gate 5.
function stripHeaderTags(text) {
  if (text == null) return null;
  return text
    .split('\n')
    .filter((line) => !/\[[A-Z_]+:[^\]]+\]/.test(line))
    .join('\n')
    .trim();
}

function main() {
  if (mode === 'ci') {
    // Best-effort: make sure the base ref is fetched (shallow CI checkouts
    // need fetch-depth:0 for this to succeed — see protocol-schema-gate.yml).
    try {
      execFileSync('git', ['rev-parse', '--verify', baseRef], { cwd: repoRoot, stdio: 'ignore' });
    } catch (_error) {
      fail(`base ref "${baseRef}" not available locally — checkout needs fetch-depth:0 (or pass --base=<ref>)`);
      process.exit(1);
    }
  }

  const currentLedger = getCurrent(LEDGER_REL) || '';
  const baseLedger = getBase(LEDGER_REL) || '';

  let blocked = 0;
  let checked = 0;

  for (const relPath of LEDGER_PROTECTED_FILES) {
    const current = stripHeaderTags(getCurrent(relPath));
    const base = stripHeaderTags(getBase(relPath));
    checked += 1;

    if (current === base) {
      continue; // no body change — nothing to gate
    }

    const marker = `- file: ${relPath}`;
    const hasFreshEntry = currentLedger.includes(marker) && !baseLedger.includes(marker);
    // Also accept a fresh entry that already existed in base but whose
    // surrounding ledger content changed alongside this file's body change
    // in the exact same proposed commit/PR (covers amending an existing
    // entry rather than always appending a brand-new one).
    const ledgerChangedThisRound = currentLedger !== baseLedger;
    const stillHasMarker = currentLedger.includes(marker);

    if (hasFreshEntry || (ledgerChangedThisRound && stillHasMarker)) {
      ok(`${relPath} changed with a matching ${LEDGER_REL} entry`);
      continue;
    }

    fail(
      `${relPath} changed with no matching ${LEDGER_REL} entry (expected a line "${marker}" added/updated alongside this change — see Gate 5 in docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md)`
    );
    blocked += 1;
  }

  if (blocked === 0) {
    ok(`${checked} protected file(s) checked, no unlogged changes`);
  }
}

main();
