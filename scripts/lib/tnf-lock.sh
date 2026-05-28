#!/usr/bin/env bash
# tnf-lock.sh — Reusable flock-based singleton guard for TNF scripts.
#
# Usage:
#   source "$(dirname "$0")/../lib/tnf-lock.sh"   # or the resolved path
#   tnf_acquire_lock "my-process-name" 300        # max stall seconds
#   # ... do work ...
#   # Lock auto-released on script exit (via fd close)
#
# How it works:
#   Uses flock(1) on a well-known lockfile under TNF_LOCK_DIR.
#   If another instance holds the lock, this instance exits 0 with
#   a JSON skip message. Stale locks are broken after staleSeconds.
#
# Environment:
#   TNF_LOCK_DIR  — directory for lock files (default: ~/.tnf/locks)

set -euo pipefail

: "${TNF_LOCK_DIR:=$HOME/.tnf/locks}"

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
    local nowMs
    nowMs=$(date +%s)
    stampAge=$(( nowMs - stampMs ))
    if (( stampAge > staleSeconds )); then
      rm -f "${lockFile}" "${stampFile}" 2>/dev/null || true
    fi
  fi

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
  # We do NOT remove the lockfile itself — flock needs it. But we zero the stamp.
  trap 'rm -f "${stampFile}" 2>/dev/null || true' EXIT

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
