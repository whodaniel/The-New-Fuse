#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/skill-bank"
mkdir -p "$LOG_DIR"

PID_FILE="$LOG_DIR/supervisor.pid"
LOCK_DIR="$LOG_DIR/supervisor.lock"
HEARTBEAT_FILE="$LOG_DIR/supervisor-heartbeat.json"
LOG_FILE="$LOG_DIR/supervisor.log"

INTERVAL_SEC="${SKILL_BANK_INTERVAL_SEC:-900}"

log() {
  echo "[$(date +%H:%M:%S)] [Skill-Bank-Supervisor] $*" | tee -a "$LOG_FILE"
}

cleanup() {
  rm -rf "$LOCK_DIR" 2>/dev/null || true
  if [[ -f "$PID_FILE" ]] && [[ "$(cat "$PID_FILE" 2>/dev/null || true)" == "$$" ]]; then
    rm -f "$PID_FILE"
  fi
}

write_heartbeat() {
  local phase="$1"
  local note="$2"
  jq -n \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg phase "$phase" \
    --arg note "$note" \
    --arg pid "$$" \
    --arg interval "$INTERVAL_SEC" \
    '{timestamp:$ts,phase:$phase,note:$note,pid:($pid|tonumber),interval_sec:($interval|tonumber)}' > "$HEARTBEAT_FILE"
}

if ! [[ "$INTERVAL_SEC" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SEC" -lt 60 ]]; then
  echo "SKILL_BANK_INTERVAL_SEC must be an integer >= 60" >&2
  exit 1
fi

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  if [[ -f "$PID_FILE" ]]; then
    existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "Skill bank supervisor already running (pid=$existing_pid)." >&2
      exit 1
    fi
  fi
  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR"
fi

trap cleanup EXIT INT TERM
echo "$$" > "$PID_FILE"

log "Starting skill-bank supervisor (pid=$$, interval=${INTERVAL_SEC}s)"
write_heartbeat "started" "boot complete"

while true; do
  write_heartbeat "cycle-start" "sync + ingest + retry"
  log "Running skills:bank:sync"
  node scripts/skills/skill-bank-sync.cjs >> "$LOG_FILE" 2>&1 || true

  log "Running skills:bank:ingest"
  node scripts/skills/skill-bank-ingest.cjs >> "$LOG_FILE" 2>&1 || true

  log "Running skills:bank:retry-pending"
  node scripts/skills/skill-bank-retry-pending.cjs >> "$LOG_FILE" 2>&1 || true

  write_heartbeat "cycle-ok" "completed"
  log "Sleeping ${INTERVAL_SEC}s"
  sleep "$INTERVAL_SEC"
done
