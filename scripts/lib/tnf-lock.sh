#!/usr/bin/env bash
# tnf-lock.sh — Reusable singleton guard for TNF scripts.
#
# Usage:
#   source "$(dirname "$0")/../lib/tnf-lock.sh"   # or the resolved path
#   tnf_acquire_lock "my-process-name" 300        # max stall seconds
#   # ... do work ...
#   # Lock auto-released on script exit (via fd close, or rmdir trap)
#
# How it works:
#   Prefers flock(1) on a well-known lockfile under TNF_LOCK_DIR when
#   available. flock is not installed by default on macOS (it ships with
#   util-linux, Linux-only) — found 2026-07-21 that every caller of this
#   library was silently exiting via the "locked" branch on every single
#   invocation on a Mac with no flock binary, because `flock -n 200`
#   itself fails with "command not found" (non-zero exit), which the
#   `if ! flock -n 200` check treats identically to "someone else holds
#   the lock." Real work was never running. Falls back to an atomic
#   `mkdir`-based mutex (same primitive scripts/lib/tnf-single-instance-guard.sh
#   already uses) when flock is unavailable, so this actually works on a
#   stock macOS install.
#   If another instance holds the lock, this instance exits 0 with
#   a JSON skip message. Stale locks are broken after staleSeconds.
#
# Environment:
#   TNF_LOCK_DIR  — directory for lock files (default: ~/.tnf/locks)

set -euo pipefail

: "${TNF_LOCK_DIR:=$HOME/.tnf/locks}"

_tnf_lock_has_flock() {
  command -v flock >/dev/null 2>&1
}

# tnf_acquire_lock <lockName> [staleSeconds=600]
#   Acquires an exclusive flock. Exits 0 with skip JSON if locked.
#   Prints lock info JSON on success.
tnf_acquire_lock() {
  local lockName="${1:?Usage: tnf_acquire_lock <lockName> [staleSeconds]}"
  local staleSeconds="${2:-600}"
  local lockDir="${TNF_LOCK_DIR}"
  local lockFile="${lockDir}/${lockName}.lock"
  local stampFile="${lockDir}/${lockName}.stamp"

  mkdir -p "${lockDir}"

  # Check for stale lock: if stamp file exists and is older than staleSeconds,
  # force-remove both files before attempting flock.
  if [[ -f "${stampFile}" ]]; then
    local stampMs stampAge
    stampMs=$(cat "${stampFile}" 2>/dev/null || echo "0")
    stampMs="${stampMs%%:*}"  # stamp is "epoch:pid" — arithmetic needs just epoch
    [[ "${stampMs}" =~ ^[0-9]+$ ]] || stampMs=0
    local nowMs
    nowMs=$(date +%s)
    stampAge=$(( nowMs - stampMs ))
    if (( stampAge > staleSeconds )); then
      rm -f "${lockFile}" "${stampFile}" 2>/dev/null || true
      rmdir "${lockDir}/${lockName}.mkdirlock" 2>/dev/null || true
    fi
  fi

  if _tnf_lock_has_flock; then
    # Open FD 200 on the lockfile for flock
    exec 200>"${lockFile}"

    # Non-blocking exclusive lock attempt (timeout 0 = immediate)
    if ! flock -n 200; then
      # Another instance holds the lock — skip
      echo "{\"ok\":true,\"skipped\":\"locked\",\"processId\":\"${lockName}\",\"lockHolderPid\":$(cat "${stampFile}" 2>/dev/null | awk -F: '{print $2}' || echo "unknown"),\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
      exit 0
    fi

    # We hold the lock. Write stamp: epoch:pid
    echo "$(date +%s):$$" > "${stampFile}"

    # Register EXIT trap to clean up stamp (flock auto-releases when FD closes)
    # We do NOT remove the lockfile itself — flock needs it. But we zero the
    # stamp. Double-quoted here so ${stampFile} is captured NOW (this is a
    # `local` var — a single-quoted trap would defer expansion to whenever
    # EXIT actually fires, by which point the function may have returned and
    # the local var gone out of scope, producing "unbound variable" under
    # set -u. Found 2026-07-21 alongside the flock/macOS issue above — this
    # path was never exercised either, for the same reason.
    trap "rm -f \"${stampFile}\" 2>/dev/null || true" EXIT
  else
    # Portable fallback: atomic mkdir as the mutex (no flock binary available).
    local mkdirLock="${lockDir}/${lockName}.mkdirlock"
    if ! mkdir "${mkdirLock}" 2>/dev/null; then
      # Directory already exists — someone holds it, unless stale.
      echo "{\"ok\":true,\"skipped\":\"locked\",\"processId\":\"${lockName}\",\"lockHolderPid\":$(cat "${stampFile}" 2>/dev/null | awk -F: '{print $2}' || echo "unknown"),\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
      exit 0
    fi

    # We hold the lock. Write stamp: epoch:pid
    echo "$(date +%s):$$" > "${stampFile}"

    # Release the mkdir mutex and clear the stamp on exit. Double-quoted for
    # the same immediate-expansion reason as the flock branch above.
    trap "rmdir \"${mkdirLock}\" 2>/dev/null || true; rm -f \"${stampFile}\" 2>/dev/null || true" EXIT
  fi

  echo "{\"ok\":true,\"acquired\":true,\"processId\":\"${lockName}\",\"pid\":$$,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
}

# tnf_check_lock <lockName> — returns 0 if lock is NOT held, 1 if held
tnf_check_lock() {
  local lockName="${1:?Usage: tnf_check_lock <lockName>}"
  local lockFile="${TNF_LOCK_DIR}/${lockName}.lock"

  if [[ ! -f "${lockFile}" ]]; then
    return 0  # not held
  fi

  exec 201>"${lockFile}"
  if flock -n 201; then
    # We got it — nobody else holds it
    exec 201>&-
    return 0
  else
    exec 201>&-
    return 1  # held by another
  fi
}
