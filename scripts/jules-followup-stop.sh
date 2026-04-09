#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
DAEMON_PID_FILE="$LOG_DIR/jules-followup-daemon.pid"
STOP_FILE="$LOG_DIR/jules-followup-daemon.stop"

stopped_any=0

if [[ -f "$DAEMON_PID_FILE" ]]; then
  daemon_pid="$(cat "$DAEMON_PID_FILE" 2>/dev/null || true)"
  if [[ -n "$daemon_pid" ]] && kill -0 "$daemon_pid" 2>/dev/null; then
    touch "$STOP_FILE"
    kill "$daemon_pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$daemon_pid" 2>/dev/null; then
      kill -9 "$daemon_pid" 2>/dev/null || true
    fi
    echo "Stopped Jules follow-up daemon (pid=$daemon_pid)."
    stopped_any=1
  fi
  rm -f "$DAEMON_PID_FILE"
fi

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "Stopped Jules follow-up supervisor worker (pid=$pid)."
    stopped_any=1
  fi
  rm -f "$PID_FILE"
fi

rm -f "$STOP_FILE"

if [[ "$stopped_any" -eq 0 ]]; then
  echo "Jules follow-up supervisor was not running."
fi

exit 0
