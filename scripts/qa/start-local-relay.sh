#!/usr/bin/env bash
# Start TNF standalone federation relay for desktop QA (default :3007).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RELAY_DIR="$ROOT/packages/relay-core"
PID_FILE="/tmp/tnf-relay-${RELAY_PORT:-3007}.pid"
LOG_FILE="/tmp/tnf-relay-${RELAY_PORT:-3007}.log"
PORT="${RELAY_PORT:-3007}"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "[relay] already running pid $(cat "$PID_FILE") on :${PORT}"
  exit 0
fi

if lsof -ti ":${PORT}" >/dev/null 2>&1; then
  health="$(curl -s -m 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null || true)"
  if echo "$health" | grep -q '"status"'; then
    echo "[relay] healthy on :${PORT} (external process)"
    exit 0
  fi
  echo "[relay] port :${PORT} occupied but not healthy — attempting start anyway"
fi

if [[ ! -f "$RELAY_DIR/dist/standalone-relay.js" ]]; then
  echo "[relay] building relay-core..."
  (cd "$RELAY_DIR" && pnpm build 2>/dev/null || npx tsc -p tsconfig.json 2>/dev/null || true)
fi

echo "[relay] starting standalone relay on :${PORT} ..."
PORT="$PORT" \
  ENABLE_REDIS_BRIDGE="${ENABLE_REDIS_BRIDGE:-false}" \
  ENABLE_ACTIVITY_PERSISTENCE="${ENABLE_ACTIVITY_PERSISTENCE:-false}" \
  ACTIVITY_PERSISTENCE_REQUIRED="${ACTIVITY_PERSISTENCE_REQUIRED:-false}" \
  nohup node "$RELAY_DIR/dist/standalone-relay.js" --port "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 60); do
  health="$(curl -s -m 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null || true)"
  if echo "$health" | grep -q '"status"'; then
    echo "[relay] healthy on :${PORT} (pid $(cat "$PID_FILE"))"
    echo "$health" | head -c 200
    echo
    exit 0
  fi
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[relay] process exited — tail $LOG_FILE"
    tail -40 "$LOG_FILE" || true
    exit 1
  fi
  sleep 1
done

echo "[relay] health timeout — tail $LOG_FILE"
tail -40 "$LOG_FILE" || true
exit 1
