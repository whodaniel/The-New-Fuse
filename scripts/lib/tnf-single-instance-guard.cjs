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

  const ownerPayload = {
    pid: process.pid,
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
