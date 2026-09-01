#!/usr/bin/env node
// scripts/protocols/check-artifacts-lifecycle.cjs
//
// CI guard for the Artifacts Lifecycle Protocol
// (docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md).
//
// Reads the policy table codified in §3 of that doc and fails CI when any
// transient-state artifact count exceeds its cap. Persistent-logic and
// operator-owned files are NOT touched by this guard — they are listed
// here only to surface "missing anchor" failures (e.g. handoff-current.json
// deleted by a runaway sweep).
//
// The guard is intentionally non-destructive. It reports what would be
// pruned and lets `scripts/operations/swarm-disk-retention.sh` do the
// actual work; this script never deletes files.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const TNF_HOME = path.join(HOME, '.tnf');

// ---------------------------------------------------------------------------
// POLICY TABLE
//
// Each rule has:
//   id           - stable name for the failure message
//   kind         - 'cap' (numeric file count), 'missing' (anchor MUST exist),
//                  'manual' (operator-owned, report-only)
//   path         - directory or file to inspect
//   cap          - for 'cap': max file count (or line count for jsonl-tail)
//   grace        - for 'cap': fraction of cap we allow to drift before
//                  failing CI. Default 0.10.
//   retentionDays - for 'cap': alternative cap; we use the smaller of
//                  (count cap) and (mtime-based). Set to null to disable.
// ---------------------------------------------------------------------------
const POLICY = [
  // Persistent-logic anchors — must exist; not capped.
  {
    id: 'roles-registry-present',
    kind: 'missing',
    path: path.join(TNF_HOME, 'authority', 'roles.json'),
    rationale: 'operator-owned role registry; its absence is a hard failure',
  },
  {
    id: 'handoff-current-present',
    kind: 'missing',
    path: path.join(TNF_HOME, 'handoff-current.json'),
    rationale: 'operator handoff current state; its absence breaks session resume',
  },
  {
    id: 'handoff-lineage-present',
    kind: 'missing',
    path: path.join(TNF_HOME, 'handoff-lineage.json'),
    rationale: 'append-only handoff lineage; its absence breaks provenance',
  },
  {
    id: 'lessons-learned-present',
    kind: 'missing',
    path: path.join(TNF_HOME, 'lessons-learned.md'),
    rationale: 'codified lessons registry; absence breaks self-improvement loop',
  },

  // Transient-state caps (numeric file count).
  {
    id: 'terminal-heartbeat-history-cap',
    kind: 'cap',
    path: path.join(TNF_HOME, 'terminal-heartbeat', 'state', 'history'),
    cap: 200,
    retentionDays: 30,
    rationale: 'heartbeat snapshots; cap 200 files OR 30 days',
  },
  {
    id: 'relay-monitor-logs-cap',
    kind: 'cap',
    path: path.join(TNF_HOME, 'relay-monitor'),
    cap: 400,
    retentionDays: 14,
    rationale: 'relay monitor logs; cap 400 files OR 14 days',
  },
  {
    id: 'wrapper-logs-cap',
    kind: 'cap',
    path: path.join(TNF_HOME, 'wrapper-logs'),
    cap: 400,
    retentionDays: 14,
    rationale: 'wrapper logs; cap 400 files OR 14 days',
  },
  {
    id: 'tnf-logs-cap',
    kind: 'cap',
    path: path.join(TNF_HOME, 'logs'),
    cap: 600,
    retentionDays: 14,
    rationale: 'tnf logs; cap 600 files OR 14 days',
  },
  {
    id: 'hermes-cron-output-cap',
    kind: 'cap',
    path: path.join(HOME, '.hermes', 'cron', 'output'),
    cap: 400,
    retentionDays: 14,
    rationale: 'hermes cron output; cap 400 files OR 14 days',
  },
  {
    id: 'agent-state-history-cap',
    kind: 'nested-history-cap',
    path: path.join(TNF_HOME, 'agent-state'),
    nestedSegment: 'history',
    cap: 300,
    retentionDays: 14,
    rationale:
      'onboarded agent-state history snapshots under agent-state/<profile>/history; ' +
      'cap 300 files OR 14 days across profiles (latest.json is never pruned)',
  },

  // JSONL-tail caps (line count, not file count).
  {
    id: 'terminal-heartbeat-jsonl-tail',
    kind: 'jsonl-tail',
    path: path.join(
      TNF_HOME,
      'terminal-heartbeat',
      'state',
      'terminal-heartbeat-history.jsonl'
    ),
    cap: 500,
    rationale: 'terminal heartbeat JSONL tail; cap 500 lines',
  },
  {
    id: 'agent-state-history-jsonl-tail',
    kind: 'nested-jsonl-tail',
    path: path.join(TNF_HOME, 'agent-state'),
    nestedFile: 'history.jsonl',
    cap: 1000,
    rationale:
      'agent-state/<profile>/history.jsonl tails; each file capped at 1000 lines',
  },

  // Operator-owned — report-only.
  {
    id: 'openclaw-pre-migration-carry-manual',
    kind: 'manual',
    path: path.join(TNF_HOME, 'openclaw-pre-migration-carry'),
    rationale:
      'operator-owned pre-migration snapshot; manual decision required ' +
      'before any delete',
  },
  {
    id: 'tnf-node-modules-manual',
    kind: 'manual',
    path: path.join(TNF_HOME, 'node_modules'),
    rationale:
      'mirrored node_modules; pnpm store prune is fine but wholesale ' +
      'delete requires operator confirmation',
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function listFilesSafe(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);
  } catch (_e) {
    return null;
  }
}

function listNestedHistoryFiles(root, nestedSegment = 'history') {
  if (!fs.existsSync(root)) return null;
  const files = [];
  try {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const historyDir = path.join(root, entry.name, nestedSegment);
      const names = listFilesSafe(historyDir);
      if (!names) continue;
      for (const name of names) {
        files.push(path.join(historyDir, name));
      }
    }
  } catch (_e) {
    return null;
  }
  return files;
}

function countOlderThanPaths(filePaths, days) {
  const cutoff = Date.now() - days * 86400_000;
  let n = 0;
  for (const filePath of filePaths) {
    try {
      if (fs.statSync(filePath).mtimeMs < cutoff) n += 1;
    } catch (_e) {
      // ignore
    }
  }
  return n;
}

function nestedJsonlLineCounts(root, nestedFile) {
  if (!fs.existsSync(root)) return null;
  const counts = [];
  try {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const filePath = path.join(root, entry.name, nestedFile);
      const n = lineCount(filePath);
      if (n != null) counts.push({ filePath, lines: n });
    }
  } catch (_e) {
    return null;
  }
  return counts;
}

function countOlderThan(p, days) {
  const cutoff = Date.now() - days * 86400_000;
  const names = listFilesSafe(p);
  if (names == null) return null;
  let n = 0;
  for (const name of names) {
    try {
      const st = fs.statSync(path.join(p, name));
      if (st.mtimeMs < cutoff) n += 1;
    } catch (_e) {
      // file moved; ignore
    }
  }
  return n;
}

function lineCount(p) {
  try {
    const data = fs.readFileSync(p, 'utf8');
    if (!data) return 0;
    return data.split('\n').filter(Boolean).length;
  } catch (_e) {
    return null;
  }
}

function evaluate(rule) {
  const { id, kind, path: p, cap, grace = 0.1, retentionDays, rationale } = rule;
  const out = { id, kind, path: p, rationale, status: 'ok' };

  if (kind === 'missing') {
    if (!fs.existsSync(p)) {
      out.status = 'fail';
      out.detail = 'missing';
    }
    return out;
  }

  if (kind === 'manual') {
    // report-only — never fail CI. Just count for operator visibility.
    let totalBytes = 0;
    let totalFiles = 0;
    if (fs.existsSync(p)) {
      for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
        try {
          const st = fs.statSync(path.join(p, entry.name));
          totalFiles += 1;
          if (st.isFile()) totalBytes += st.size;
          else if (st.isDirectory()) {
            // shallow dir size — full recursive walk is too slow for CI
            for (const inner of fs.readdirSync(path.join(p, entry.name))) {
              try {
                totalBytes += fs.statSync(path.join(p, entry.name, inner)).size;
              } catch (_e) {}
            }
          }
        } catch (_e) {}
      }
    }
    out.status = 'report';
    out.detail = `${totalFiles} entries, ${Math.round(totalBytes / 1024 / 1024)}MB`;
    return out;
  }

  if (kind === 'cap') {
    const names = listFilesSafe(p);
    if (names == null) {
      out.status = 'skip';
      out.detail = 'directory does not exist (yet)';
      return out;
    }
    const count = names.length;
    out.count = count;
    out.cap = cap;
    out.threshold = Math.floor(cap * (1 + grace));

    const olderThanCount =
      retentionDays != null ? countOlderThan(p, retentionDays) : null;
    if (olderThanCount != null) out.olderThanDays = olderThanCount;

    const overCount = count > cap;
    const overGrace = count > out.threshold;
    const overAge =
      retentionDays != null && olderThanCount > Math.floor((cap * grace) / 2);
    if (overGrace || overAge) {
      out.status = 'fail';
      out.detail =
        `count=${count} cap=${cap} threshold=${out.threshold}` +
        (retentionDays != null ? ` olderThan${retentionDays}d=${olderThanCount}` : '');
    } else if (overCount) {
      out.status = 'warn';
      out.detail = `count=${count} cap=${cap} (within ${Math.round(grace * 100)}% grace)`;
    } else {
      out.detail = `count=${count} cap=${cap}`;
    }
    return out;
  }

  if (kind === 'jsonl-tail') {
    const n = lineCount(p);
    if (n == null) {
      out.status = 'skip';
      out.detail = 'jsonl does not exist (yet)';
      return out;
    }
    out.count = n;
    out.cap = cap;
    out.threshold = Math.floor(cap * (1 + grace));
    if (n > out.threshold) {
      out.status = 'fail';
      out.detail = `lines=${n} cap=${cap} threshold=${out.threshold}`;
    } else if (n > cap) {
      out.status = 'warn';
      out.detail = `lines=${n} cap=${cap} (within grace)`;
    } else {
      out.detail = `lines=${n} cap=${cap}`;
    }
    return out;
  }

  if (kind === 'nested-history-cap') {
    const files = listNestedHistoryFiles(p, rule.nestedSegment || 'history');
    if (files == null) {
      out.status = 'skip';
      out.detail = 'directory does not exist (yet)';
      return out;
    }
    const count = files.length;
    out.count = count;
    out.cap = cap;
    out.threshold = Math.floor(cap * (1 + grace));
    const olderThanCount =
      retentionDays != null ? countOlderThanPaths(files, retentionDays) : null;
    if (olderThanCount != null) out.olderThanDays = olderThanCount;
    const overCount = count > cap;
    const overGrace = count > out.threshold;
    const overAge =
      retentionDays != null && olderThanCount > Math.floor((cap * grace) / 2);
    if (overGrace || overAge) {
      out.status = 'fail';
      out.detail =
        `count=${count} cap=${cap} threshold=${out.threshold}` +
        (retentionDays != null ? ` olderThan${retentionDays}d=${olderThanCount}` : '');
    } else if (overCount) {
      out.status = 'warn';
      out.detail = `count=${count} cap=${cap} (within ${Math.round(grace * 100)}% grace)`;
    } else {
      out.detail = `count=${count} cap=${cap}`;
    }
    return out;
  }

  if (kind === 'nested-jsonl-tail') {
    const counts = nestedJsonlLineCounts(p, rule.nestedFile || 'history.jsonl');
    if (counts == null || counts.length === 0) {
      out.status = 'skip';
      out.detail = 'nested jsonl does not exist (yet)';
      return out;
    }
    const worst = counts.reduce((a, b) => (a.lines >= b.lines ? a : b));
    out.count = worst.lines;
    out.cap = cap;
    out.threshold = Math.floor(cap * (1 + grace));
    out.detailFiles = counts.length;
    if (worst.lines > out.threshold) {
      out.status = 'fail';
      out.detail = `worst lines=${worst.lines} file=${worst.filePath} cap=${cap}`;
    } else if (worst.lines > cap) {
      out.status = 'warn';
      out.detail = `worst lines=${worst.lines} cap=${cap} (within grace)`;
    } else {
      out.detail = `worst lines=${worst.lines} cap=${cap} across ${counts.length} profile(s)`;
    }
    return out;
  }

  out.status = 'skip';
  out.detail = `unknown rule kind: ${kind}`;
  return out;
}

// ---------------------------------------------------------------------------
// ENTRY
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlyId = onlyArg ? onlyArg.slice('--only='.length) : null;
  const jsonOnly = args.includes('--json');

  const results = [];
  for (const rule of POLICY) {
    if (onlyId && rule.id !== onlyId) continue;
    results.push(evaluate(rule));
  }

  const failures = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warn');
  const reports = results.filter((r) => r.status === 'report');

  const summary = {
    ok: failures.length === 0,
    scannedAt: new Date().toISOString(),
    policyVersion: 1,
    policyDoc: 'docs/protocols/TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md',
    failures,
    warnings,
    reports,
    all: results,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Artifacts Lifecycle Policy scan — ${summary.ok ? 'OK' : 'FAIL'}`);
    for (const r of results) {
      const tag = r.status.toUpperCase().padEnd(5);
      console.log(`  [${tag}] ${r.id}  ${r.detail || ''}`);
    }
    if (failures.length) {
      console.error('\nFailures:');
      for (const f of failures) {
        console.error(`  - ${f.id}: ${f.detail}\n    ${f.rationale}\n    path=${f.path}`);
      }
    }
    if (warnings.length) {
      console.error('\nWarnings:');
      for (const w of warnings) {
        console.error(`  - ${w.id}: ${w.detail}`);
      }
    }
    if (reports.length) {
      console.log('\nOperator-owned (manual decision required):');
      for (const r of reports) {
        console.log(`  - ${r.id}: ${r.detail}  (${r.path})`);
      }
    }
  }

  process.exit(failures.length ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { POLICY, evaluate };
