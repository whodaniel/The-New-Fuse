'use strict';

/**
 * Shared helpers for "are worker agents still running as the operator?"
 * Used by confirm-isolation AND the separate-uid trust-root probe so a
 * root-owned / sudo-false-passed isolation marker cannot claim a boundary
 * that live processes contradict.
 */

const { execFileSync } = require('node:child_process');

/** Worker wrappers that must not share the operator uid. */
const WORKER_AGENT_PATTERNS = [
  'gemini-redis-wrapper',
  'jules-redis-wrapper',
  'claude-redis-wrapper',
  'antigravity-redis-wrapper',
  'pi-wrapper',
  'pi-coding-agent',
  'pi-redis-wrapper',
];

/**
 * Real operator uid — even when the CLI was invoked via `sudo`.
 * Under sudo, process.getuid() is 0, which would make the straggler scan
 * look for workers as root and false-pass (the bug that wrote a root-owned
 * isolation marker while jules/antigravity still ran as uid 501).
 */
function operatorUid({ selfUid = null } = {}) {
  if (selfUid !== null) return selfUid;
  const sudo = process.env.SUDO_UID;
  if (sudo !== undefined && sudo !== '') {
    const n = Number.parseInt(sudo, 10);
    if (Number.isFinite(n)) return n;
  }
  return typeof process.getuid === 'function' ? process.getuid() : null;
}

function operatorGid() {
  const sudo = process.env.SUDO_GID;
  if (sudo !== undefined && sudo !== '') {
    const n = Number.parseInt(sudo, 10);
    if (Number.isFinite(n)) return n;
  }
  return typeof process.getgid === 'function' ? process.getgid() : null;
}

/**
 * @returns {string[]} "pid full-command" for each matching worker on the operator uid
 */
function workerAgentsRunningAsOperator({ psOutput = null, selfUid = null } = {}) {
  const uid = operatorUid({ selfUid });
  if (uid === null) return [];
  let out = psOutput;
  if (out === null) {
    try {
      out = execFileSync('ps', ['-axo', 'uid,pid,command'], { encoding: 'utf8' });
    } catch {
      return [];
    }
  }
  const hits = [];
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    const [, lineUid, pid, command] = m;
    if (Number.parseInt(lineUid, 10) !== uid) continue;
    if (WORKER_AGENT_PATTERNS.some((p) => command.includes(p))) {
      hits.push(`${pid} ${command}`);
    }
  }
  return hits;
}

/** Map a straggler line to scripts/<pattern>.cjs under scriptsDir. */
function resolveWorkerScript(hitLine, scriptsDir) {
  const path = require('node:path');
  const fs = require('node:fs');
  const pattern = WORKER_AGENT_PATTERNS.find((p) => hitLine.includes(p));
  if (!pattern) return null;
  const scriptPath = path.join(scriptsDir, `${pattern}.cjs`);
  return fs.existsSync(scriptPath) ? scriptPath : null;
}

module.exports = {
  WORKER_AGENT_PATTERNS,
  operatorUid,
  operatorGid,
  workerAgentsRunningAsOperator,
  resolveWorkerScript,
};
