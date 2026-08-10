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
    out = execFileSync('ps', ['-ax', '-o', 'pid=,ppid=,command='], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    return { allMatching: [], loopProcesses: [] };
  }
  const table = [];
  for (const line of out.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    table.push({ pid: Number(m[1]), ppid: Number(m[2]), cmd: m[3] });
  }
  const procs = [];
  for (const entry of table) {
    const { pid, cmd } = entry;
    // Match real loop entrypoints; exclude this observer and pgrep/rg noise.
    if (!/\bfull-auto\s+start\b/.test(cmd)) continue;
    if (/tnf-full-auto-contention-observe/.test(cmd)) continue;
    if (/\b(pgrep|rg|grep)\b/.test(cmd) && !/cli\.ts/.test(cmd)) continue;
    procs.push(entry);
  }
  const matchPids = new Set(procs.map((p) => p.pid));
  const roots = procs.filter((p) => !matchPids.has(p.ppid));
  const byPid = new Map(table.map((e) => [e.pid, e]));
  const children = new Map();
  for (const entry of table) {
    const list = children.get(entry.ppid) || [];
    list.push(entry.pid);
    children.set(entry.ppid, list);
  }
  const collectDescendants = (rootPid) => {
    const outPids = [];
    const stack = [rootPid];
    while (stack.length) {
      const pid = stack.pop();
      outPids.push(pid);
      for (const child of children.get(pid) || []) stack.push(child);
    }
    return outPids;
  };
  const dedup = [];
  const seen = new Set();
  for (const root of roots) {
    const descendants = collectDescendants(root.pid)
      .map((pid) => byPid.get(pid))
      .filter(Boolean)
      .filter((e) => matchPids.has(e.pid));
    const leaf =
      descendants.find((e) => /cli\.ts\s+full-auto\s+start/.test(e.cmd) && !/\/tsx\s/.test(e.cmd)) ||
      descendants.find((e) => /cli\.ts\s+full-auto\s+start/.test(e.cmd)) ||
      root;
    if (seen.has(leaf.pid)) continue;
    seen.add(leaf.pid);
    dedup.push({ pid: leaf.pid, cmd: leaf.cmd });
  }
  return { allMatching: procs.map((p) => ({ pid: p.pid, cmd: p.cmd })), loopProcesses: dedup };
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
