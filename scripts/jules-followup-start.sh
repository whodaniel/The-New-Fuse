#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
LAUNCH_LOG="$LOG_DIR/jules-followup-launch.log"

if [[ -f "$PID_FILE" ]]; then
  existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "Jules follow-up supervisor already running (pid=$existing_pid)."
    exit 0
  fi
  rm -f "$PID_FILE"
fi

nohup bash scripts/jules-followup-supervisor.sh >>"$LAUNCH_LOG" 2>&1 &
new_pid=$!
sleep 1

if kill -0 "$new_pid" 2>/dev/null; then
  echo "Started Jules follow-up supervisor (pid=$new_pid)."
  echo "Logs: $LAUNCH_LOG"
  exit 0
fi

echo "Failed to start Jules follow-up supervisor. Check $LAUNCH_LOG" >&2
exit 1
