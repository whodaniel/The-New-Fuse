#!/usr/bin/env bash
# =============================================================================
# tnf-build-watchdog.sh — Wraps a build command with a hard timeout + memory cap.
#
# Usage:
#   tnf-build-watchdog.sh [timeout_seconds] -- <command> [args...]
#   tnf-build-watchdog.sh 300 -- pnpm run build
#   tnf-build-watchdog.sh -- pnpm run build          # uses default 300s
#
# Exit codes:
#   0  — command succeeded within timeout
#   1  — command failed (non-zero exit)
#   3  — timeout exceeded (WATCHDOG_TIMEOUT)
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_TIMEOUT=300                           # 5 minutes
LOG_DIR="${HOME}/.tnf/logs"
LOG_FILE="${LOG_DIR}/build-watchdog.log"
NODE_MEM_CAP=2048                             # MB — cap Node.js heap

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
ts()  { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[watchdog] $*"; }
logfile() {
  mkdir -p "$LOG_DIR"
  printf '%s\t%s\n' "$(ts)" "$*" >> "$LOG_FILE"
}

usage() {
  echo "Usage: $(basename "$0") [timeout_seconds] -- <command> [args...]"
  echo "       Default timeout: ${DEFAULT_TIMEOUT}s"
  exit 1
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
TIMEOUT="$DEFAULT_TIMEOUT"

# If first arg is an integer (and not "--"), treat it as the timeout.
if [[ $# -gt 0 && "$1" =~ ^[0-9]+$ ]]; then
  TIMEOUT="$1"
  shift
fi

# Consume the "--" separator.
if [[ $# -gt 0 && "$1" == "--" ]]; then
  shift
fi

[[ $# -eq 0 ]] && usage

CMD=("$@")
CMD_STR="${CMD[*]}"

# ---------------------------------------------------------------------------
# Memory cap — set NODE_OPTIONS unless the caller already supplied one
# ---------------------------------------------------------------------------
if [[ -z "${NODE_OPTIONS:-}" ]]; then
  export NODE_OPTIONS="--max-old-space-size=${NODE_MEM_CAP}"
  log "NODE_OPTIONS set to --max-old-space-size=${NODE_MEM_CAP}"
else
  log "NODE_OPTIONS already set by caller: ${NODE_OPTIONS}"
fi

# ---------------------------------------------------------------------------
# Signal handling — clean up the child process group on SIGTERM/SIGINT
# ---------------------------------------------------------------------------
CHILD_PID=
PGID=

cleanup() {
  local sig="${1:-TERM}"
  if [[ -n "$CHILD_PID" ]]; then
    log "Received signal $sig — killing process group PGID=${PGID:-$CHILD_PID}"
    if [[ -n "$PGID" ]]; then
      kill -"$sig" -- "-${PGID}" 2>/dev/null || true
    else
      kill -"$sig" "$CHILD_PID" 2>/dev/null || true
    fi
  fi
}

trap 'cleanup TERM' TERM
trap 'cleanup INT'  INT

# ---------------------------------------------------------------------------
# Shell-based timeout implementation (works without GNU coreutils)
# ---------------------------------------------------------------------------
shell_timeout() {
  local deadline=$(( $(date +%s) + TIMEOUT ))
  set -m
  "${CMD[@]}" &
  CHILD_PID=$!
  PGID=$(ps -o pgid= -p "$CHILD_PID" 2>/dev/null | tr -d ' ') || PGID="$CHILD_PID"

  while kill -0 "$CHILD_PID" 2>/dev/null; do
    if [[ $(date +%s) -ge $deadline ]]; then
      local elapsed=$(( $(date +%s) - (deadline - TIMEOUT) ))
      log "TIMEOUT exceeded after ${elapsed}s — killing PGID=${PGID}"
      logfile "TIMEOUT\tcmd=${CMD_STR}\ttimeout=${TIMEOUT}s\telapsed=${elapsed}s"
      kill -TERM -- "-${PGID}" 2>/dev/null || kill -TERM "$CHILD_PID" 2>/dev/null || true
      sleep 2
      kill -KILL -- "-${PGID}" 2>/dev/null || kill -KILL "$CHILD_PID" 2>/dev/null || true
      CHILD_PID=
      return 3
    fi
    sleep 1
  done

  wait "$CHILD_PID"
  local rc=$?
  CHILD_PID=
  return $rc
}

# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------
log "Starting: ${CMD_STR}"
log "Timeout : ${TIMEOUT}s"
log "Node cap: ${NODE_MEM_CAP}MB"

START=$(date +%s)
logfile "START\tcmd=${CMD_STR}\ttimeout=${TIMEOUT}s"

# Prefer gtimeout (GNU coreutils via Homebrew) → GNU timeout → shell fallback.
EXIT_CODE=0
if command -v gtimeout &>/dev/null; then
  log "Using gtimeout (GNU coreutils)"
  set -m
  gtimeout --kill-after=5s --signal=TERM "${TIMEOUT}s" "${CMD[@]}" &
  CHILD_PID=$!
  PGID=$(ps -o pgid= -p "$CHILD_PID" 2>/dev/null | tr -d ' ') || PGID="$CHILD_PID"
  if wait "$CHILD_PID"; then
    EXIT_CODE=0
  else
    EXIT_CODE=$?
    [[ $EXIT_CODE -eq 124 ]] && EXIT_CODE=3
  fi
  CHILD_PID=
elif command -v timeout &>/dev/null && timeout --version 2>&1 | grep -q GNU; then
  log "Using GNU timeout"
  set -m
  timeout --kill-after=5s --signal=TERM "${TIMEOUT}" "${CMD[@]}" &
  CHILD_PID=$!
  PGID=$(ps -o pgid= -p "$CHILD_PID" 2>/dev/null | tr -d ' ') || PGID="$CHILD_PID"
  if wait "$CHILD_PID"; then
    EXIT_CODE=0
  else
    EXIT_CODE=$?
    [[ $EXIT_CODE -eq 124 ]] && EXIT_CODE=3
  fi
  CHILD_PID=
else
  log "Using shell-based timeout (no GNU coreutils found)"
  shell_timeout || EXIT_CODE=$?
fi

END=$(date +%s)
ELAPSED=$(( END - START ))

if [[ $EXIT_CODE -eq 3 ]]; then
  log "WATCHDOG KILLED — command exceeded ${TIMEOUT}s (ran ${ELAPSED}s): ${CMD_STR}"
  logfile "KILLED\tcmd=${CMD_STR}\ttimeout=${TIMEOUT}s\telapsed=${ELAPSED}s\texit=3"
elif [[ $EXIT_CODE -ne 0 ]]; then
  log "FAILED (exit=${EXIT_CODE}, elapsed=${ELAPSED}s): ${CMD_STR}"
  logfile "FAILED\tcmd=${CMD_STR}\telapsed=${ELAPSED}s\texit=${EXIT_CODE}"
else
  log "OK — completed in ${ELAPSED}s: ${CMD_STR}"
  logfile "OK\tcmd=${CMD_STR}\telapsed=${ELAPSED}s"
fi

exit "$EXIT_CODE"
