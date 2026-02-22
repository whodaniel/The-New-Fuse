#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
HEARTBEAT_FILE="$LOG_DIR/jules-followup-heartbeat.json"
LAUNCH_LOG="$LOG_DIR/jules-followup-launch.log"
STATE_FILE="$LOG_DIR/jules-followup-supervisor-state.json"

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "status=running pid=$pid"
  else
    echo "status=stale-pid pid=${pid:-unknown}"
  fi
else
  echo "status=stopped"
fi

if [[ -f "$HEARTBEAT_FILE" ]]; then
  echo "heartbeat:"
  jq '{timestamp, phase, notes, cycle, interval_sec, consecutive_errors, summary}' "$HEARTBEAT_FILE"
else
  echo "heartbeat: missing"
fi

if [[ -f "$LAUNCH_LOG" ]]; then
  echo "recent_log_tail:"
  tail -n 20 "$LAUNCH_LOG"
else
  echo "recent_log_tail: missing"
fi

if [[ -f "$STATE_FILE" ]]; then
  echo "alert_state:"
  jq '{stalledCycles: (.stalledCycles | to_entries | sort_by(-.value) | .[:10]), lastAlertAt}' "$STATE_FILE"
else
  echo "alert_state: missing"
fi
