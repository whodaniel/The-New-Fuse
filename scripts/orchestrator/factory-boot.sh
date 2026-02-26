#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
RUNTIME_STATE_DIR="${ROOT_DIR}/.agent/runtime-state"
LIVE_API_CACHE_FILE="${RUNTIME_STATE_DIR}/live-api-url.txt"
REDIS_RESOLVER="${ROOT_DIR}/scripts/runtime/resolve-cloud-redis.sh"
mkdir -p "${LOG_DIR}"
mkdir -p "${RUNTIME_STATE_DIR}"

if [[ -z "${REDIS_URL:-}" ]]; then
  if [[ -x "${REDIS_RESOLVER}" ]]; then
    REDIS_URL="$("${REDIS_RESOLVER}")"
  else
    echo "[factory-boot] ERROR: redis resolver missing or not executable: ${REDIS_RESOLVER}"
    exit 1
  fi
fi
RELAY_URL="${RELAY_URL:-ws://localhost:3000/ws}"
LEDGER_API_BASE="${LEDGER_API_BASE:-${RAILWAY_API_URL:-${LIVE_API_BASE_URL:-${API_BASE_URL:-${TNF_API_BASE:-http://localhost:3001}}}}}"
AUTO_DETECT_RAILWAY_API="${AUTO_DETECT_RAILWAY_API:-true}"

STALL_THRESHOLD="${STALL_THRESHOLD:-45000}"
RECOVERY_INTERVAL="${RECOVERY_INTERVAL:-30000}"
SELF_PROMPT_ENABLED="${SELF_PROMPT_ENABLED:-true}"
SELF_PROMPT_COOLDOWN_MS="${SELF_PROMPT_COOLDOWN_MS:-30000}"
FACTORY_SUPERVISOR_ENABLED="${FACTORY_SUPERVISOR_ENABLED:-true}"

echo "[factory-boot] root=${ROOT_DIR}"
echo "[factory-boot] log_dir=${LOG_DIR}"

if [[ "${REDIS_URL}" == *"localhost"* ]] || [[ "${REDIS_URL}" == *"127.0.0.1"* ]]; then
  echo "[factory-boot] redis target=local (${REDIS_URL})"
else
  echo "[factory-boot] redis target=remote"
fi

if [[ "${AUTO_DETECT_RAILWAY_API}" == "true" ]] && [[ "${LEDGER_API_BASE}" == "http://localhost:3001" ]]; then
  if command -v railway >/dev/null 2>&1; then
    RAILWAY_DOMAIN_URL="$(railway domain 2>/dev/null | rg -o 'https://[^[:space:]]+' -m 1 || true)"
    if [[ -n "${RAILWAY_DOMAIN_URL}" ]]; then
      LEDGER_API_BASE="${RAILWAY_DOMAIN_URL}"
      echo "[factory-boot] auto-detected railway api: ${LEDGER_API_BASE}"
    fi
  fi
fi

echo "[factory-boot] ledger_api_base=${LEDGER_API_BASE}"
printf "%s\n" "${LEDGER_API_BASE}" > "${LIVE_API_CACHE_FILE}"

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "[factory-boot] ERROR: redis-cli not found"
  exit 1
fi

if ! redis-cli -u "${REDIS_URL}" ping >/dev/null 2>&1; then
  echo "[factory-boot] ERROR: Redis not reachable at ${REDIS_URL}"
  exit 1
fi

if curl -fsS --max-time 2 "${LEDGER_API_BASE%/}/api/health" >/dev/null 2>&1; then
  echo "[factory-boot] ledger api healthy at ${LEDGER_API_BASE%/}/api/health"
elif curl -fsS --max-time 2 "${LEDGER_API_BASE%/}/health" >/dev/null 2>&1; then
  echo "[factory-boot] ledger api healthy at ${LEDGER_API_BASE%/}/health"
else
  echo "[factory-boot] WARNING: ledger api not reachable at ${LEDGER_API_BASE} (master-clock/director persistence may degrade)"
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
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' RELAY_URL='${RELAY_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' STALL_THRESHOLD='${STALL_THRESHOLD}' RECOVERY_INTERVAL='${RECOVERY_INTERVAL}' SELF_PROMPT_ENABLED='${SELF_PROMPT_ENABLED}' SELF_PROMPT_COOLDOWN_MS='${SELF_PROMPT_COOLDOWN_MS}' pnpm --filter @the-new-fuse/relay-core run master-clock:dev" \
    > "${LOG_DIR}/master-clock-dev.log" 2>&1 &
  sleep 3
fi

if pgrep -f "ts-node src/broker-agent.ts" >/dev/null 2>&1; then
  echo "[factory-boot] broker-agent already running"
else
  echo "[factory-boot] starting broker-agent:dev"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' pnpm --filter @the-new-fuse/relay-core run broker-agent:dev" \
    > "${LOG_DIR}/broker-agent-dev.log" 2>&1 &
  sleep 2
fi

if pgrep -f "ts-node src/director-agent.ts" >/dev/null 2>&1; then
  echo "[factory-boot] director-agent already running"
else
  echo "[factory-boot] starting director-agent:dev"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' DIRECTOR_AUTO_POLICY='risk-aware' pnpm --filter @the-new-fuse/relay-core run director-agent:dev" \
    > "${LOG_DIR}/director-agent-dev.log" 2>&1 &
  sleep 2
fi

if pgrep -f "ts-node --compiler-options.*src/orchestrator/start.ts" >/dev/null 2>&1; then
  echo "[factory-boot] workflow router already running"
else
  echo "[factory-boot] starting workflow router"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' pnpm --filter @the-new-fuse/workflow-engine exec ts-node --compiler-options '{\"module\":\"CommonJS\"}' src/orchestrator/start.ts" \
    > "${LOG_DIR}/workflow-router.log" 2>&1 &
  sleep 2
fi

echo "[factory-boot] relay health:"
curl -sS --max-time 2 http://localhost:3000/health || true
echo
echo "[factory-boot] orchestrator state:"
redis-cli -u "${REDIS_URL}" HGET tnf:master:state orchestrator || true
echo
echo "[factory-boot] task queues:"
redis-cli -u "${REDIS_URL}" LLEN tnf:master:tasks:realtime || true
redis-cli -u "${REDIS_URL}" LLEN tnf:master:tasks:planning || true
echo "[factory-boot] broker decisions:"
redis-cli -u "${REDIS_URL}" PUBSUB NUMSUB tnf:broker:decisions || true
echo "[factory-boot] director review queue:"
redis-cli -u "${REDIS_URL}" LLEN tnf:director:review:pending || true
echo "[factory-boot] director decisions:"
redis-cli -u "${REDIS_URL}" PUBSUB NUMSUB tnf:director:decisions || true
echo

if [[ "${FACTORY_SUPERVISOR_ENABLED}" == "true" ]]; then
  if pgrep -f "scripts/orchestrator/factory-supervisor.sh" >/dev/null 2>&1; then
    echo "[factory-boot] supervisor already running"
  else
    echo "[factory-boot] starting factory-supervisor"
    nohup bash -lc "cd '${ROOT_DIR}' && scripts/orchestrator/factory-supervisor.sh" \
      >> "${LOG_DIR}/factory-supervisor.log" 2>&1 &
    sleep 1
  fi
else
  echo "[factory-boot] supervisor disabled (FACTORY_SUPERVISOR_ENABLED=false)"
fi

echo "[factory-boot] complete"
