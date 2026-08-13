#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
DAEMON_PID_FILE="$LOG_DIR/jules-followup-daemon.pid"
STOP_FILE="$LOG_DIR/jules-followup-daemon.stop"
LAUNCH_LOG="$LOG_DIR/jules-followup-launch.log"

if [[ -f "$DAEMON_PID_FILE" ]]; then
  existing_pid="$(cat "$DAEMON_PID_FILE" 2>/dev/null || true)"
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "Jules follow-up daemon already running (pid=$existing_pid)."
    exit 0
  fi
  rm -f "$DAEMON_PID_FILE"
fi

rm -f "$PID_FILE"
rm -f "$STOP_FILE"

if command -v setsid >/dev/null 2>&1; then
  nohup setsid bash scripts/jules-followup-daemon.sh >>"$LAUNCH_LOG" 2>&1 < /dev/null &
else
  nohup bash scripts/jules-followup-daemon.sh >>"$LAUNCH_LOG" 2>&1 < /dev/null &
fi
new_pid=$!
sleep 1

if kill -0 "$new_pid" 2>/dev/null; then
  echo "Started Jules follow-up daemon (pid=$new_pid)."
  echo "Logs: $LAUNCH_LOG"
  exit 0
fi

echo "Failed to start Jules follow-up daemon. Check $LAUNCH_LOG" >&2
exit 1
