#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tnf-status.cjs — canonical TNF SYSTEM STATUS renderer (issue #176).
 *
 * Replaces the 11-week-old standalone ~/.tnf/tnf-status script, which carried
 * a hand-maintained Turn Zero copy/paste prompt that drifted from the current
 * onboarding architecture. All semantics here derive from repository
 * authority:
 *   - handoff packet: scripts/lib/sync-handoff-cache.cjs refreshing
 *     ~/.tnf/handoff-current.json from docs/protocols/reports/SESSION_HANDOFF_LATEST.json
 *   - onboarding prompt: scripts/lib/tnf-canonical-onboarding.cjs
 *
 * ~/.tnf/tnf-status is a thin wrapper that execs this file; it holds no
 * independent status logic.
 *
 * Usage:
 *   node scripts/runtime/tnf-status.cjs [--repo <path>] [--json] [--full]
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { syncFromRepo } = require('../lib/sync-handoff-cache.cjs');
const { CANONICAL_RAW_AGENT_PROMPT } = require('../lib/tnf-canonical-onboarding.cjs');

function parseArgs(argv) {
  const out = { repo: null, json: false, full: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--repo' && argv[i + 1]) out.repo = argv[++i];
    else if (a === '--json' || a === '--health-json') out.json = true;
    else if (a === '--full') out.full = true;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: tnf-status [--repo <path>] [--json] [--full]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      console.error('Usage: tnf-status [--repo <path>] [--json] [--full]');
      process.exit(2);
    }
  }
  return out;
}

function resolveRepoRoot(explicit) {
  const candidates = [
    explicit,
    process.env.TNF_REPO_DIR,
    process.env.TNF_REPO,
    process.cwd(),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'))
    ) {
      return candidate;
    }
  }
  return candidates[candidates.length - 1] || process.cwd();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = resolveRepoRoot(args.repo);

  // Best-effort refresh from canonical handoff before rendering.
  const sync = syncFromRepo(repoRoot);
  const cachePath = path.join(os.homedir(), '.tnf', 'handoff-current.json');
  const data = readJson(cachePath);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ok: Boolean(data),
          repoRoot,
          sync,
          cachePath,
          sessionKey: data?.sessionKey ?? null,
          generatedAt: data?.generatedAt ?? null,
          stateCount: Array.isArray(data?.STATE) ? data.STATE.length : 0,
          immediateTasks: Array.isArray(data?.IMMEDIATE_TASKS) ? data.IMMEDIATE_TASKS : [],
          onboarding: { canonical: true, prompt: CANONICAL_RAW_AGENT_PROMPT },
        },
        null,
        2
      )
    );
    process.exit(data ? 0 : 0); // status is advisory; never fail shells on it
  }

  const line = '============================================================';
  console.log(`\n${line}`);
  console.log('🛡️  TNF SYSTEM STATUS');
  console.log(`${line}`);
  if (!data) {
    console.log('⚠️  No handoff cache available.');
    console.log(`   Expected: ${cachePath}`);
    console.log(`   Canonical source: ${path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json')}`);
    if (sync && sync.ok === false) console.log(`   Sync note: ${sync.reason || 'unavailable'}`);
  } else {
    console.log(`Repo:    ${repoRoot}`);
    console.log(`Session: ${data.sessionKey || 'unknown'}`);
    console.log(`Updated: ${data.generatedAt || 'unknown'}`);
    if (data.branch) console.log(`Branch:  ${data.branch}`);
    console.log('');

    const stateItems = Array.isArray(data.STATE) ? data.STATE : [];
    if (stateItems.length) {
      console.log('STATE:');
      for (const item of stateItems.slice(0, 6)) console.log(`  • ${item}`);
      console.log('');
    }

    const tasks = Array.isArray(data.IMMEDIATE_TASKS) ? data.IMMEDIATE_TASKS : [];
    console.log('IMMEDIATE TASKS:');
    if (tasks.length) {
      for (const task of tasks.slice(0, 6)) console.log(`  ⏳ ${String(task).replace(/^\d+\)\s*/, '')}`);
    } else {
      console.log('  (none)');
    }
    console.log('');
  }

  console.log('ONBOARDING (canonical — issue #176):');
  console.log(`  "${CANONICAL_RAW_AGENT_PROMPT}"`);
  console.log('  Launch raw AI CLIs from the TNF repository root so repo-relative paths resolve.');
  console.log('');

  if (args.full && data) {
    console.log(line);
    console.log('FULL PACKET DETAILS');
    console.log(line);
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("💡 Tip: use 'tnf-status --full' for complete packet details");
    console.log("   or 'cat ~/.tnf/handoff-current.json' for raw JSON");
  }
  console.log('');
}

main();
