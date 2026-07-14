#!/usr/bin/env bash
# Start TNF REST API on port 3001 for desktop QA (uses apps/api/.env).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_DIR="$ROOT/apps/api"
PID_FILE="/tmp/tnf-api-3001.pid"
LOG_FILE="/tmp/tnf-api-3001.log"
PORT="${PORT:-3001}"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "[api] already running pid $(cat "$PID_FILE")"
  exit 0
fi

if [[ ! -f "$API_DIR/dist/main.js" ]]; then
  echo "[api] building api..."
  (cd "$API_DIR" && pnpm build)
fi

set -a
# shellcheck disable=SC1091
source "$API_DIR/.env"
set +a

echo "[api] starting on http://127.0.0.1:${PORT} ..."
JWT_SECRET="${JWT_SECRET:-local-dev-secret}" \
  NODE_ENV=development \
  HOSTMARIA_AUTO_SYNC_ENABLED=false \
  PORT="$PORT" \
  nohup node "$API_DIR/dist/main.js" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 120); do
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/api/health" 2>/dev/null || echo 000)"
  if [[ "$code" =~ ^2 ]]; then
    echo "[api] healthy HTTP $code (pid $(cat "$PID_FILE"))"
    exit 0
  fi
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[api] process exited — tail $LOG_FILE"
    tail -40 "$LOG_FILE" || true
    exit 1
  fi
  sleep 2
done

echo "[api] health timeout — tail $LOG_FILE"
tail -40 "$LOG_FILE" || true
exit 1
