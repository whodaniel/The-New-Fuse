#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
mkdir -p "${LOG_DIR}"

REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
RELAY_URL="${RELAY_URL:-ws://localhost:3000/ws}"

STALL_THRESHOLD="${STALL_THRESHOLD:-45000}"
RECOVERY_INTERVAL="${RECOVERY_INTERVAL:-30000}"
SELF_PROMPT_ENABLED="${SELF_PROMPT_ENABLED:-true}"
SELF_PROMPT_COOLDOWN_MS="${SELF_PROMPT_COOLDOWN_MS:-30000}"

echo "[factory-boot] root=${ROOT_DIR}"
echo "[factory-boot] log_dir=${LOG_DIR}"

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "[factory-boot] ERROR: redis-cli not found"
  exit 1
fi

if ! redis-cli -u "${REDIS_URL}" ping >/dev/null 2>&1; then
  echo "[factory-boot] ERROR: Redis not reachable at ${REDIS_URL}"
  exit 1
fi

if curl -fsS --max-time 2 http://localhost:3000/health >/dev/null 2>&1; then
  echo "[factory-boot] relay already healthy on :3000"
else
  echo "[factory-boot] starting relay-core relay:dev"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' ENABLE_REDIS_BRIDGE=true ACTIVITY_PERSISTENCE_ENABLED=true pnpm --filter @the-new-fuse/relay-core run relay:dev" \
    > "${LOG_DIR}/relay-dev.log" 2>&1 &
  sleep 3
fi

if pgrep -f "ts-node src/master-clock.ts" >/dev/null 2>&1; then
  echo "[factory-boot] master-clock already running"
else
  echo "[factory-boot] starting master-clock:dev"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' RELAY_URL='${RELAY_URL}' STALL_THRESHOLD='${STALL_THRESHOLD}' RECOVERY_INTERVAL='${RECOVERY_INTERVAL}' SELF_PROMPT_ENABLED='${SELF_PROMPT_ENABLED}' SELF_PROMPT_COOLDOWN_MS='${SELF_PROMPT_COOLDOWN_MS}' pnpm --filter @the-new-fuse/relay-core run master-clock:dev" \
    > "${LOG_DIR}/master-clock-dev.log" 2>&1 &
  sleep 3
fi

echo "[factory-boot] relay health:"
curl -sS --max-time 2 http://localhost:3000/health || true
echo
echo "[factory-boot] orchestrator state:"
redis-cli HGET tnf:master:state orchestrator || true
echo
echo "[factory-boot] complete"
