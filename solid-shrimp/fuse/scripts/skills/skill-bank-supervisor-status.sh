#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

PID_FILE=".agent/skill-bank/supervisor.pid"
HEARTBEAT_FILE=".agent/skill-bank/supervisor-heartbeat.json"
LOG_FILE=".agent/skill-bank/supervisor.log"

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "status=running pid=$pid"
  else
    echo "status=stale-pid pid=${pid:-unknown}"
  fi
else
  echo "status=stopped"
fi

if [[ -f "$HEARTBEAT_FILE" ]]; then
  echo "heartbeat:"
  cat "$HEARTBEAT_FILE"
else
  echo "heartbeat: missing"
fi

if [[ -f "$LOG_FILE" ]]; then
  echo "recent_log_tail:"
  tail -n 20 "$LOG_FILE"
else
  echo "recent_log_tail: missing"
fi
