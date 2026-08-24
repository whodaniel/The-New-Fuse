#!/usr/bin/env node

/**
 * TNF Single-Instance Guard
 *
 * Prevents multiple concurrent invocations of the same TNF routine.
 * Uses an atomic mkdir-based lock with stale detection and PID validation.
 *
 * Usage (at the top of any TNF script):
 *
 *   const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
 *   const guard = singleInstanceGuard({ lockName: 'my-routine-name', staleMs: 300000 });
 *   if (!guard.acquired) {
 *     console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: guard.existingLock }));
 *     process.exit(0);
 *   }
 *   // ... do work ...
 *   guard.release();  // optional — stale detection handles crashes
 *
 * Lock files are stored in ~/.tnf/locks/ by default, or TNF_LOCKS_DIR if set.
 * Each lock is a directory containing an owner.json with pid, startedAt, and source.
 *
 * CLI mode (for bash callers — e.g. scripts/start-agent-network.sh):
 *
 *   node scripts/lib/tnf-single-instance-guard.cjs acquire \
 *     --lock-name <name> [--stale-ms N] [--locks-dir DIR] [--source LABEL]
 *   node scripts/lib/tnf-single-instance-guard.cjs release \
 *     --lock-name <name> [--locks-dir DIR] [--pid N]
 *   node scripts/lib/tnf-single-instance-guard.cjs check --lock-name <name>
 *
 * Every mode prints exactly one JSON line. `acquire` exits 0 when the lock was
 * acquired (or recovered from a stale owner) and 1 when a live owner holds it.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_LOCKS_DIR = path.join(os.homedir(), '.tnf', 'locks');
const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutes

function singleInstanceGuard(options = {}) {
  const lockName = options.lockName || path.basename(process.argv[1] || 'unknown', path.extname(process.argv[1] || 'unknown'));
  const staleMs = Number(options.staleMs) > 0 ? Number(options.staleMs) : DEFAULT_STALE_MS;
  const locksDir = options.locksDir || process.env.TNF_LOCKS_DIR || DEFAULT_LOCKS_DIR;
  const lockPath = path.join(locksDir, `${lockName}.lock`);
  const ownerFile = path.join(lockPath, 'owner.json');
  // CLI/bash callers pass the invoking shell PID via options.ownerPid; a bare
  // require() caller owns the lock with its own node process.
  const ownerPid =
    Number(options.ownerPid) > 0 ? Number(options.ownerPid) : process.pid;

  const ownerPayload = {
    pid: ownerPid,
    ppid: process.ppid,
    command: process.argv.slice(0, 3).join(' '),
    lockName,
    startedAt: new Date().toISOString(),
    hostname: os.hostname(),
  };

  function readExistingOwner() {
    try {
      return JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
    } catch {
      return null;
    }
  }

  function isProcessAlive(pid) {
    try {
      // signal 0 = existence check, no signal sent
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  function isLockStale() {
    const existing = readExistingOwner();

    // A live owner process is authoritative. Age alone must not evict it.
    if (existing && existing.pid && isProcessAlive(existing.pid)) return false;

    // Dead owners are stale even if the lock directory is still young.
    if (existing && existing.pid && !isProcessAlive(existing.pid)) return true;

    // Ownerless or unreadable locks fall back to mtime age.
    try {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > staleMs) return true;
    } catch {
      return true; // can't stat = stale / broken
    }

    return false;
  }

  function forceRemoveLock() {
    try {
      fs.rmSync(lockPath, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }

  function createLock() {
    // Ensure the locks directory exists before the atomic mkdir attempt.
    try {
      fs.mkdirSync(locksDir, { recursive: true });
    } catch {}

    try {
      fs.mkdirSync(lockPath, { recursive: false });
    } catch (error) {
      if (error.code === 'EEXIST') return false;
      throw error;
    }
    try {
      fs.writeFileSync(ownerFile, JSON.stringify(ownerPayload, null, 2), 'utf8');
    } catch {
      // Lock dir created but owner file failed — still count as acquired
    }
    return true;
  }

  // --- Main acquisition logic ---

  // Try to acquire the lock
  if (createLock()) {
    return {
      acquired: true,
      lockPath,
      owner: ownerPayload,
      release() {
        forceRemoveLock();
      },
    };
  }

  // Lock exists — check if stale
  if (isLockStale()) {
    forceRemoveLock();
    // Re-attempt after cleanup
    if (createLock()) {
      return {
        acquired: true,
        lockPath,
        owner: ownerPayload,
        recovered: true,
        previousLock: readExistingOwner(),
        release() {
          forceRemoveLock();
        },
      };
    }
  }

  // Lock is held by a live process within stale window
  const existingOwner = readExistingOwner();
  return {
    acquired: false,
    lockPath,
    existingLock: existingOwner,
    staleIn: (() => {
      try {
        const stat = fs.statSync(lockPath);
        return Math.max(0, staleMs - (Date.now() - stat.mtimeMs));
      } catch {
        return 0;
      }
    })(),
  };
}

module.exports = { singleInstanceGuard };

// --- CLI mode (issue #176): lets bash boot scripts reuse this same guard ---
function cliMain(argv) {
  const emit = (payload, code) => {
    console.log(JSON.stringify(payload));
    process.exit(code);
  };

  const action = argv[0];
  // Default owner is the invoking shell (parent of this short-lived node
  // process) so the lock outlives the helper and liveness checks reflect the
  // actual boot script. --pid overrides for release-by-specific-owner.
  const opts = {
    lockName: null,
    staleMs: DEFAULT_STALE_MS,
    locksDir: process.env.TNF_LOCKS_DIR || DEFAULT_LOCKS_DIR,
    source: 'cli',
    pid: process.ppid > 1 ? process.ppid : process.pid,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--lock-name' && argv[i + 1]) opts.lockName = argv[++i];
    else if (a === '--stale-ms' && argv[i + 1]) opts.staleMs = parseInt(argv[++i], 10) || DEFAULT_STALE_MS;
    else if (a === '--locks-dir' && argv[i + 1]) opts.locksDir = argv[++i];
    else if (a === '--source' && argv[i + 1]) opts.source = argv[++i];
    else if (a === '--pid' && argv[i + 1]) opts.pid = parseInt(argv[++i], 10);
    else emit({ ok: false, error: `unknown argument: ${a}` }, 2);
  }

  if (!opts.lockName) emit({ ok: false, error: '--lock-name is required' }, 2);

  const lockPath = path.join(opts.locksDir, `${opts.lockName}.lock`);
  const ownerFile = path.join(lockPath, 'owner.json');

  if (action === 'acquire') {
    const guard = singleInstanceGuard({
      lockName: opts.lockName,
      staleMs: opts.staleMs,
      locksDir: opts.locksDir,
      ownerPid: opts.pid,
    });
    // Stamp CLI provenance into the owner file.
    try {
      const owner = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
      owner.source = `cli:${opts.source}`;
      fs.writeFileSync(ownerFile, JSON.stringify(owner, null, 2), 'utf8');
    } catch {}
    if (guard.acquired) {
      emit({ ok: true, acquired: true, recovered: Boolean(guard.recovered), lockPath, owner: guard.owner }, 0);
    }
    emit({ ok: false, acquired: false, lockPath, existingLock: guard.existingLock || null, staleIn: guard.staleIn }, 1);
  }

  if (action === 'release') {
    let owner = null;
    try {
      owner = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
    } catch {
      // Unreadable owner: remove only an already-dead holder's leftovers.
      fs.rmSync(lockPath, { recursive: true, force: true });
      emit({ ok: true, released: true, reason: 'unreadable-or-missing-owner', lockPath }, 0);
    }
    if (!fs.existsSync(lockPath)) emit({ ok: true, released: false, reason: 'not-held', lockPath }, 0);
    if (Number(owner.pid) !== Number(opts.pid)) {
      emit({ ok: false, released: false, reason: 'pid-mismatch', lockPath, owner }, 1);
    }
    fs.rmSync(lockPath, { recursive: true, force: true });
    emit({ ok: true, released: true, lockPath }, 0);
  }

  if (action === 'check') {
    let owner = null;
    let alive = false;
    try {
      owner = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
      alive = owner.pid ? (() => { try { process.kill(Number(owner.pid), 0); return true; } catch { return false; } })() : false;
    } catch {}
    emit({ ok: true, held: fs.existsSync(lockPath), ownerAlive: alive, owner, lockPath }, 0);
  }

  emit({ ok: false, error: `unknown action: ${action}. Use acquire|release|check` }, 2);
}

if (require.main === module) {
  cliMain(process.argv.slice(2));
}
