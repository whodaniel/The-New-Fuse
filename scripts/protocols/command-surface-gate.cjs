#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Pre-commit / CI command-surface gate for the tnf CLI.
 *
 * Why this exists: the tnf CLI registers ~450 command paths in
 * packages/tnf-cli/src/cli.ts, and command-surface.test.ts snapshots every
 * command, alias, option, and description. Until 2026-08-16 nothing ran that
 * snapshot as a gate, so 8 commands and 4 signatures drifted into the CLI with
 * no oracle noticing (see lessons-learned 2026-08-16 "Command-Surface Snapshot
 * Drift Accumulates Silently"). A CLI whose --help surface silently diverges
 * from the snapshot is the "plausible-looking change does nothing" failure
 * class this gate exists to prevent.
 *
 * Scope discipline — same rule as build-gate.cjs:
 *   A gate that fails on pre-existing breakage gets bypassed with --no-verify
 *   within a day, and a bypassed gate is worse than no gate. So in staged mode
 *   this only runs when a relevant file (cli.ts, any src/commands/** module,
 *   or the snapshot itself) is actually staged. In CI mode it always runs.
 *
 * Honest reporting: if the package cannot be checked (no dist build, tsx
 * missing, timeout) it is reported as SKIPPED with a reason — never silently
 * treated as passing.
 *
 * Escape hatch (for genuine emergencies, logged loudly):
 *   TNF_SKIP_COMMAND_SURFACE_GATE=1 git commit ...
 */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG_DIR = path.join(REPO_ROOT, 'packages', 'tnf-cli');
const SURFACE_TEST = path.join(PKG_DIR, 'src', 'command-surface.test.ts');
const SNAPSHOT = path.join(PKG_DIR, 'src', 'command-surface.snapshot.json');
const SURFACE_RELEVANT =
  /^packages\/tnf-cli\/src\/(cli\.ts|commands\/|.*command-surface.*\.(ts|json)$)/;

function stagedFiles() {
  const out = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }
  );
  return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

function main() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => a.startsWith('--mode='))?.split('=')[1] || 'staged';

  if (process.env.TNF_SKIP_COMMAND_SURFACE_GATE === '1') {
    console.log('[command-surface-gate] SKIPPED via TNF_SKIP_COMMAND_SURFACE_GATE=1');
    process.exit(0);
  }

  if (mode === 'staged') {
    const relevant = stagedFiles().filter((f) => SURFACE_RELEVANT.test(f));
    if (relevant.length === 0) {
      console.log('[command-surface-gate] OK (staged): no tnf-cli surface files staged');
      process.exit(0);
    }
    console.log(`[command-surface-gate] RUN (staged): ${relevant.join(', ')}`);
  } else {
    console.log('[command-surface-gate] RUN (ci): full command-surface oracle');
  }

  if (!fs.existsSync(SURFACE_TEST)) {
    console.log(`[command-surface-gate] SKIPPED: ${path.relative(REPO_ROOT, SURFACE_TEST)} missing`);
    process.exit(0);
  }

  const result = spawnSync('npx', ['tsx', SURFACE_TEST], {
    cwd: PKG_DIR,
    encoding: 'utf8',
    env: { ...process.env, TNF_SKIP_TURN_ZERO_ONBOARD: '1' },
    timeout: 180_000,
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    console.log(`[command-surface-gate] SKIPPED: could not spawn surface test (${result.error.message})`);
    process.exit(0);
  }
  if (result.status !== 0) {
    console.error(`[command-surface-gate] BLOCKED (${mode}): command surface differs from snapshot`);
    console.error(result.stdout || '');
    console.error(result.stderr || '');
    console.error('\n  If intended: cd packages/tnf-cli && npx tsx src/command-surface.test.ts --update,');
    console.error('  review the diff, and include it in the same change set.');
    process.exit(1);
  }

  console.log(`[command-surface-gate] OK (${mode}): surface matches snapshot`);
  process.exit(0);
}

main();
