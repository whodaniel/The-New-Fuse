#!/usr/bin/env node
/* eslint-disable no-console */

// Enforces Gate 5 of docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md.
// A body change to a protected governance document must be accompanied by a
// newly-added challenge rationale. Historical rationale remains in the original
// monolithic CHALLENGE_RATIONALE_LOG.md; new changes may use immutable event
// files under docs/protocols/challenge-rationales/ so the audit trail scales
// without rewriting an ever-growing ledger on every governance change.
//
// Usage:
//   node scripts/protocols/validate-locked-doc-ledger.cjs --mode=staged
//   node scripts/protocols/validate-locked-doc-ledger.cjs --mode=ci [--base=<ref>]

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=staged';
const mode = modeArg.split('=')[1] || 'staged';
const baseArg = args.find((arg) => arg.startsWith('--base='));
const baseRef = baseArg ? baseArg.split('=')[1] : process.env.TNF_LOCKED_DOC_LEDGER_BASE_REF || 'origin/main';

const repoRoot = process.cwd();
const LEGACY_LEDGER_REL = 'docs/protocols/CHALLENGE_RATIONALE_LOG.md';
const EVENT_DIR_REL = 'docs/protocols/challenge-rationales';

const LEDGER_PROTECTED_FILES = [
  'docs/protocols/DIRECTIVES.md',
  'docs/protocols/TURN_ZERO_MANDATE.md',
  'docs/protocols/TURN_END_MANDATE.md',
];

function fail(message) {
  console.error(`[locked-doc-ledger] BLOCKED (${mode}): ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`[locked-doc-ledger] OK (${mode}): ${message}`);
}

function git(args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...options,
    });
  } catch {
    return null;
  }
}

function gitShow(ref, relPath) {
  return git(['show', `${ref}:${relPath}`]);
}

function gitShowStaged(relPath) {
  return git(['show', `:${relPath}`]);
}

function readWorkingTree(relPath) {
  const absPath = path.join(repoRoot, relPath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

function getCurrent(relPath) {
  return mode === 'staged' ? gitShowStaged(relPath) || readWorkingTree(relPath) : readWorkingTree(relPath);
}

function getBase(relPath) {
  return mode === 'staged' ? gitShow('HEAD', relPath) : gitShow(baseRef, relPath);
}

function stripHeaderTags(text) {
  if (text == null) return null;
  return text
    .split('\n')
    .filter((line) => !/\[[A-Z_]+:[^\]]+\]/.test(line))
    .join('\n')
    .trim();
}

function changedEventFiles() {
  const diffArgs = mode === 'staged'
    ? ['diff', '--cached', '--name-status', '--', EVENT_DIR_REL]
    : ['diff', '--name-status', baseRef, '--', EVENT_DIR_REL];
  const output = git(diffArgs) || '';
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...parts] = line.split(/\s+/);
      return { status, relPath: parts.pop() };
    })
    .filter((entry) => entry.relPath && entry.relPath.startsWith(`${EVENT_DIR_REL}/`) && entry.status.startsWith('A'));
}

function freshChallengeTexts() {
  const texts = [];

  // Legacy append-only ledger remains accepted for compatibility.
  const currentLegacy = getCurrent(LEGACY_LEDGER_REL) || '';
  const baseLegacy = getBase(LEGACY_LEDGER_REL) || '';
  if (currentLegacy !== baseLegacy) {
    texts.push({ source: LEGACY_LEDGER_REL, text: currentLegacy });
  }

  // Preferred V2 path: one immutable event file per governance challenge.
  for (const event of changedEventFiles()) {
    const text = getCurrent(event.relPath);
    if (text) texts.push({ source: event.relPath, text });
  }

  return texts;
}

function main() {
  if (mode === 'ci') {
    const verified = git(['rev-parse', '--verify', baseRef]);
    if (!verified) {
      fail(`base ref "${baseRef}" unavailable — CI checkout needs fetch-depth:0 or --base=<ref>`);
      return;
    }
  }

  const challengeTexts = freshChallengeTexts();
  let blocked = 0;

  for (const relPath of LEDGER_PROTECTED_FILES) {
    const current = stripHeaderTags(getCurrent(relPath));
    const base = stripHeaderTags(getBase(relPath));

    if (current === base) continue;

    const marker = `- file: ${relPath}`;
    const source = challengeTexts.find((entry) => entry.text.includes(marker));
    if (source) {
      ok(`${relPath} changed with rationale in ${source.source}`);
      continue;
    }

    fail(
      `${relPath} changed with no fresh rationale. Add an immutable event under ${EVENT_DIR_REL}/ containing "${marker}" (or append a fresh entry to ${LEGACY_LEDGER_REL}).`
    );
    blocked += 1;
  }

  if (blocked === 0) {
    ok(`${LEDGER_PROTECTED_FILES.length} protected file(s) checked; all changed bodies have fresh rationale events`);
  }
}

main();
