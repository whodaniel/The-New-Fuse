#!/usr/bin/env node
/**
 * A3 — Dual full-auto contention observer (observe-only; never kills by default).
 *
 * Usage:
 *   node scripts/operations/tnf-full-auto-contention-observe.cjs [--json] [--append]
 *
 * FORBIDDEN on default path: kill / pkill / killall / --resolve-kill
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = process.env.TNF_REPO_ROOT || path.resolve(__dirname, '../..');
const jsonMode = process.argv.includes('--json');
const append = process.argv.includes('--append');
const resolveKill = process.argv.includes('--resolve-kill');

const STATE = path.join(ROOT, 'docs/operations/tnf-full-auto-state.json');
const RUNS = path.join(ROOT, 'docs/operations/tnf-full-auto-runs.jsonl');
const DAEMON_PID = path.join(ROOT, 'docs/operations/tnf-full-auto-daemon.pid');
const LOOP_PID = path.join(ROOT, 'docs/operations/tnf-full-auto.pid');
const LOG = path.join(ROOT, 'docs/operations/tnf-full-auto-contention.jsonl');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function mtimeIso(p) {
  try {
    return new Date(fs.statSync(p).mtimeMs).toISOString();
  } catch {
    return null;
  }
}

function tailJsonl(p, n = 3) {
  try {
    const lines = fs
      .readFileSync(p, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
    return lines.slice(-n).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
  } catch {
    return [];
  }
}

function listFullAutoStartProcesses() {
  let out = '';
  try {
    out = execFileSync('ps', ['-ax', '-o', 'pid=,command='], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    return [];
  }
  const procs = [];
  for (const line of out.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d+)\s+(.*)$/);
    if (!m) continue;
    const pid = Number(m[1]);
    const cmd = m[2];
    // Match real loop entrypoints; exclude this observer and pgrep/rg noise.
    if (!/\bfull-auto\s+start\b/.test(cmd)) continue;
    if (/tnf-full-auto-contention-observe/.test(cmd)) continue;
    if (/\b(pgrep|rg|grep)\b/.test(cmd) && !/cli\.ts/.test(cmd)) continue;
    procs.push({ pid, cmd });
  }
  // Collapse trees: prefer unique process groups by leaf cli.ts node when present
  const leaf = procs.filter((p) => /cli\.ts\s+full-auto\s+start/.test(p.cmd) && !/npm exec/.test(p.cmd) && !/\/tsx\s/.test(p.cmd));
  const uniqueRoots = leaf.length
    ? leaf
    : procs.filter((p) => /cli\.ts\s+full-auto\s+start/.test(p.cmd));
  // Dedup by pid
  const seen = new Set();
  const dedup = [];
  for (const p of uniqueRoots.length ? uniqueRoots : procs) {
    if (seen.has(p.pid)) continue;
    seen.add(p.pid);
    dedup.push(p);
  }
  return { allMatching: procs, loopProcesses: dedup };
}

function main() {
  if (resolveKill) {
    console.error(
      '[contention-observe] --resolve-kill is not enabled on this queue item (kill_jobs_forbidden). Observe-only exit.'
    );
    process.exit(3);
  }

  const { allMatching, loopProcesses } = listFullAutoStartProcesses();
  const daemonPid = (() => {
    try {
      return Number(String(fs.readFileSync(DAEMON_PID, 'utf8')).trim()) || null;
    } catch {
      return null;
    }
  })();
  const loopPidFile = (() => {
    try {
      return Number(String(fs.readFileSync(LOOP_PID, 'utf8')).trim()) || null;
    } catch {
      return null;
    }
  })();

  const loopCount = loopProcesses.length;
  const sample = {
    schema: 'tnf.full_auto.contention.v1',
    generatedAt: new Date().toISOString(),
    host: os.hostname(),
    loopCount,
    contention: loopCount >= 2,
    processes: loopProcesses,
    allMatchingCount: allMatching.length,
    pidFiles: {
      daemonPid,
      loopPid: loopPidFile,
      daemonPidFresh: daemonPid ? loopProcesses.some((p) => p.pid === daemonPid) : false,
      loopPidFresh: loopPidFile ? loopProcesses.some((p) => p.pid === loopPidFile) : false,
    },
    state: {
      path: path.relative(ROOT, STATE),
      mtime: mtimeIso(STATE),
      payload: readJson(STATE),
    },
    runsTail: tailJsonl(RUNS, 3),
    policy: {
      observeOnly: true,
      killJobsForbidden: true,
      note: 'Adversarial dual full-auto = observe only. Do not recommend kill.',
    },
  };

  if (append) {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, `${JSON.stringify(sample)}\n`, 'utf8');
  }

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(sample, null, 2)}\n`);
  } else {
    console.log(`[contention-observe] loopCount=${loopCount} contention=${sample.contention}`);
    for (const p of loopProcesses) {
      console.log(`  - pid=${p.pid} ${p.cmd.slice(0, 140)}`);
    }
    if (loopCount >= 2) {
      console.log(`CONTENTION: ${loopCount} loops (observe-only — do not kill)`);
    }
  }

  process.exit(0);
}

main();
