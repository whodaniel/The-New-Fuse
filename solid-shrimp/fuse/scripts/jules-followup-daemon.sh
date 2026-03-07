#!/usr/bin/env bash
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"

LAUNCH_LOG="$LOG_DIR/jules-followup-launch.log"
DAEMON_PID_FILE="$LOG_DIR/jules-followup-daemon.pid"
STOP_FILE="$LOG_DIR/jules-followup-daemon.stop"

cleanup() {
  if [[ -f "$DAEMON_PID_FILE" ]] && [[ "$(cat "$DAEMON_PID_FILE" 2>/dev/null || true)" == "$$" ]]; then
    rm -f "$DAEMON_PID_FILE"
  fi
  rm -f "$STOP_FILE"
}

trap cleanup EXIT INT TERM
echo "$$" > "$DAEMON_PID_FILE"

echo "[$(date +%H:%M:%S)] [Jules-Daemon] Started (pid=$$)." >>"$LAUNCH_LOG"

while true; do
  if [[ -f "$STOP_FILE" ]]; then
    echo "[$(date +%H:%M:%S)] [Jules-Daemon] Stop requested." >>"$LAUNCH_LOG"
    break
  fi

  bash scripts/jules-followup-supervisor.sh >>"$LAUNCH_LOG" 2>&1
  exit_code=$?

  if [[ -f "$STOP_FILE" ]]; then
    echo "[$(date +%H:%M:%S)] [Jules-Daemon] Supervisor exited during stop (code=$exit_code)." >>"$LAUNCH_LOG"
    break
  fi

  echo "[$(date +%H:%M:%S)] [Jules-Daemon] Supervisor exited (code=$exit_code); restarting in 5s." >>"$LAUNCH_LOG"
  sleep 5
done

