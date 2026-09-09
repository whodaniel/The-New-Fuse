#!/usr/bin/env node
/**
 * sweep-source-gate.cjs — commit-msg gate for heartbeat/cron "sweep:" commits.
 *
 * The rule "routine sweeps must NEVER stage source code" lived in the
 * terminal-heartbeat prompt template (terminal-heartbeat-pulse.cjs:124) — and
 * on 2026-09-05 a sweep committed packages/shared/src/index.ts, cli.ts, and
 * scripts/harness/check-workspace-lease.cjs anyway. Prompt-only rules fail
 * exactly the way the 2026-09-03 lesson says ("validate on read when the
 * writer set is unbounded"): the writer set here is every agent a heartbeat
 * or cron wakes, and nothing validated at the action site. This gate is the
 * action site.
 *
 * A commit whose message starts with "sweep:" may only carry non-source
 * paths (data, docs, reports, generated board/state files). Deliberate
 * exception: TNF_ALLOW_SWEEP_SOURCE=1, which lands in the commit message or
 * the operator log — an override is a decision, not a bypass.
 *
 * Runs from .husky/commit-msg with the message file as $1. Staged paths are
 * still queryable at the commit-msg stage (the commit object does not exist
 * yet).
 *
 * Exit codes: 0 = not a sweep commit, or sweep with no source paths, or
 * override set. 1 = sweep commit carrying source paths (or internal error is
 * fail-open → 0).
 */

'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { matchPath } = require('../harness/check-workspace-lease.cjs');

/**
 * Source in the heartbeat rule's sense: anything whose change is behavioral.
 * Deliberately narrower than "apps/" — apps/frontend/public/** data files
 * (terminal boards, visualizations) are the legitimate sweep payload.
 */
const SOURCE_PATTERNS = [
  'packages/**/src/**',
  'apps/**/src/**',
  'scripts/**',
  '.husky/**',
  '**/*.ts',
  '**/*.tsx',
  '**/*.cjs',
  '**/*.mjs',
  '**/*.sh',
];

function classifySweep(message) {
  return /^sweep:/im.test(String(message || ''));
}

function sweepViolations(stagedPaths, patterns) {
  const pats = patterns || SOURCE_PATTERNS;
  return (stagedPaths || []).filter((p) => pats.some((pat) => matchPath(pat, p)));
}

function stagedPaths(repoRoot, cap) {
  try {
    const out = execFileSync('git', ['diff', '--cached', '--name-only'], {
      cwd: repoRoot, encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, cap || 500);
  } catch {
    return [];
  }
}

function main(argv) {
  let messageFile = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--message-file') messageFile = argv[++i] || null;
  }
  let message = '';
  try {
    message = messageFile ? fs.readFileSync(messageFile, 'utf8') : '';
  } catch (err) {
    console.warn(`[sweep-source-gate] message file unreadable, failing open: ${err.message}`);
    return 0;
  }
  if (!classifySweep(message)) return 0;

  if (process.env.TNF_ALLOW_SWEEP_SOURCE === '1') {
    console.log('[sweep-source-gate] sweep commit with TNF_ALLOW_SWEEP_SOURCE=1 — source paths allowed by explicit override.');
    return 0;
  }

  const repoRoot = process.cwd();
  const paths = stagedPaths(repoRoot);
  const violations = sweepViolations(paths);
  if (!violations.length) {
    console.log('[sweep-source-gate] sweep commit carries only non-source paths. OK');
    return 0;
  }
  console.error('[sweep-source-gate] BLOCKED: "sweep:" commits must never stage source code.');
  console.error('  The no-source rule is a heartbeat-prompt invariant, validated here at the action site');
  console.error('  (lessons/2026-09-05-stale-buffer-clobber-and-critical-sections.md; incidents bf04b72a2, e2271e7c3).');
  console.error(`  Offending staged paths (${violations.length}):`);
  for (const p of violations.slice(0, 20)) console.error(`    ${p}`);
  console.error('  Sweeps carry data/docs/reports only. Code changes go on a dedicated task branch with an');
  console.error('  explicit file list and a non-sweep commit message.');
  console.error('  Deliberate exception: TNF_ALLOW_SWEEP_SOURCE=1 (disclosed override).');
  return 1;
}

module.exports = { classifySweep, sweepViolations, SOURCE_PATTERNS };

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`[sweep-source-gate] internal error, failing open: ${err.message}`);
    process.exit(0);
  }
}
