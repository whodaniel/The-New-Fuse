#!/usr/bin/env bash
set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/runtime/federation-channel-broker.cjs"
LOG_DIR="${HOME}/.tnf/federation-brokers/logs"
PID_FILE="${HOME}/.tnf/federation-brokers/broker.pid"

mkdir -p "$LOG_DIR" "$(dirname "$PID_FILE")"

start() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Already running pid $(cat "$PID_FILE")"
    exit 0
  fi

  export RELAY_URL="${RELAY_URL:-ws://127.0.0.1:3007/ws}"
  export TNF_FEDERATION_CHANNEL="${TNF_FEDERATION_CHANNEL:-}"
  export TNF_FEDERATION_COMPUTE_AGENT="${TNF_FEDERATION_COMPUTE_AGENT:-}"
  if [[ -z "$TNF_FEDERATION_CHANNEL" ]]; then
    echo "Set TNF_FEDERATION_CHANNEL (e.g. Red). Green uses green-channel-coordinator-service.sh"
    exit 1
  fi
  nohup node "$SCRIPT" >>"${LOG_DIR}/stdout.log" 2>>"${LOG_DIR}/stderr.log" &
  echo $! >"$PID_FILE"
  echo "Started federation-channel-broker pid $(cat "$PID_FILE") channel=${TNF_FEDERATION_CHANNEL}"
}

stop() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  echo "Stopped federation-channel-broker"
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
