#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/runtime/green-channel-coordinator.cjs"
LOG_DIR="${HOME}/.tnf/green-coordinator/logs"
PID_FILE="${HOME}/.tnf/green-coordinator/coordinator.pid"

mkdir -p "$LOG_DIR" "$(dirname "$PID_FILE")"

start() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Already running pid $(cat "$PID_FILE")"
    exit 0
  fi

  BOOTSTRAP="$ROOT_DIR/scripts/runtime/redis-local-bootstrap.sh"
  if [[ -x "$BOOTSTRAP" ]]; then
    if ! bash "$BOOTSTRAP" gate; then
      echo "Redis gate failed — attempting bootstrap restart"
      bash "$BOOTSTRAP" restart || {
        echo "ERROR: cannot start healthy local Redis; refusing to launch BROKER-Green" >&2
        exit 1
      }
    fi
  elif ! redis-cli ping >/dev/null 2>&1; then
    echo "ERROR: Redis unreachable and bootstrap script missing" >&2
    exit 1
  fi

  export RELAY_URL="${RELAY_URL:-ws://127.0.0.1:3007/ws}"
  export TNF_GREEN_CHANNEL="${TNF_GREEN_CHANNEL:-Green}"
  nohup node "$SCRIPT" >>"${LOG_DIR}/stdout.log" 2>>"${LOG_DIR}/stderr.log" &
  echo $! >"$PID_FILE"
  echo "Started green-channel-coordinator pid $(cat "$PID_FILE")"
}

stop() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  echo "Stopped green-channel-coordinator"
}

status() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Running pid $(cat "$PID_FILE")"
  else
    echo "Not running"
  fi
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  *)
    echo "Usage: $0 <start|stop|restart|status>"
    exit 1
    ;;
esac
