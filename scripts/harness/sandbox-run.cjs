#!/usr/bin/env node
/**
 * Materialize seatbelt profile and optionally run a command under sandbox-exec (macOS).
 * Usage:
 *   node scripts/harness/sandbox-run.cjs --materialize-only
 *   node scripts/harness/sandbox-run.cjs -- node -e "console.log('ok')"
 */
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const MATERIALIZE = path.join(ROOT, 'scripts/harness/materialize-sandbox-profile.cjs');
const DEFAULT_OUT = path.join(ROOT, 'data/harness/receipts/tnf-sandbox.materialized.sb');

function parseArgs(argv) {
  const out = { materializeOnly: false, profile: DEFAULT_OUT, cmd: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--materialize-only') out.materializeOnly = true;
    else if (t === '--profile') out.profile = path.resolve(argv[++i] || out.profile);
    else if (t === '--') {
      out.cmd = argv.slice(i + 1);
      break;
    } else if (!t.startsWith('-') && out.cmd.length === 0 && !out.materializeOnly) {
      // allow: sandbox-run.cjs echo hi
      out.cmd = argv.slice(i);
      break;
    }
  }
  return out;
}

function materialize(profilePath) {
  const r = spawnSync(process.execPath, [MATERIALIZE, '--out', profilePath], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || 'materialize failed');
  }
  return JSON.parse(r.stdout || '{}');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const mat = materialize(opts.profile);
  if (opts.materializeOnly || opts.cmd.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          profile: opts.profile,
          materialized: mat,
          note: 'Pass -- <cmd> … to execute under sandbox-exec on darwin.',
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  if (process.platform !== 'darwin') {
    console.error('sandbox-exec is macOS-only; running unsandboxed with warning.');
    const r = spawnSync(opts.cmd[0], opts.cmd.slice(1), { cwd: ROOT, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }

  if (!fs.existsSync(opts.profile)) {
    throw new Error(`missing profile: ${opts.profile}`);
  }

  const r = spawnSync('sandbox-exec', ['-f', opts.profile, ...opts.cmd], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(r.status ?? 1);
}

try {
  main();
} catch (err) {
  console.error(`sandbox-run: ${err.message}`);
  process.exit(1);
}
