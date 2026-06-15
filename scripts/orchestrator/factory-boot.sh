#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
RUNTIME_STATE_DIR="${ROOT_DIR}/.agent/runtime-state"
LIVE_API_CACHE_FILE="${RUNTIME_STATE_DIR}/live-api-url.txt"
REDIS_RESOLVER="${ROOT_DIR}/scripts/runtime/resolve-cloud-redis.sh"
REDIS_FAIL_OPEN="${FACTORY_BOOT_REDIS_FAIL_OPEN:-true}"
LOCAL_REDIS_URL="${FACTORY_BOOT_LOCAL_REDIS_URL:-redis://localhost:6379}"
START_LOCAL_REDIS_ON_FALLBACK="${FACTORY_BOOT_START_LOCAL_REDIS:-true}"
RELAY_FORCE_RESTART="${FACTORY_BOOT_RELAY_FORCE_RESTART:-false}"
RELAY_PORT="${RELAY_PORT:-3000}"
PORT_PREFLIGHT_ENABLED="${FACTORY_BOOT_PORT_PREFLIGHT:-true}"
PORT_PREFLIGHT_STRICT="${FACTORY_BOOT_PORT_PREFLIGHT_STRICT:-false}"
mkdir -p "${LOG_DIR}"
mkdir -p "${RUNTIME_STATE_DIR}"

get_port_3000_pids() {
  lsof -ti :"${RELAY_PORT}" 2>/dev/null | sort -u || true
}

is_relay_pid() {
  local pid="$1"
  local cmdline
  cmdline="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  [[ "${cmdline}" == *"standalone-relay.js"* ]] || [[ "${cmdline}" == *"src/standalone-relay.ts"* ]]
}

find_relay_pid_on_port_3000() {
  local pid
  for pid in $(get_port_3000_pids); do
    if is_relay_pid "${pid}"; then
      echo "${pid}"
      return 0
    fi
  done
  return 1
}

terminate_relay_pid() {
  local pid="$1"
  if [[ -z "${pid}" ]]; then
    return 0
  fi
  kill -TERM "${pid}" 2>/dev/null || true
  sleep 1
  if kill -0 "${pid}" >/dev/null 2>&1; then
    echo "[factory-boot] relay pid ${pid} did not exit on SIGTERM; sending SIGKILL"
    kill -KILL "${pid}" 2>/dev/null || true
  fi
}

if [[ -z "${REDIS_URL:-}" ]]; then
  if [[ -x "${REDIS_RESOLVER}" ]]; then
    resolver_allow_local="false"
    if [[ "${REDIS_FAIL_OPEN}" == "true" ]]; then
      resolver_allow_local="true"
    fi

    resolved_redis_url=""
    if resolved_redis_url="$(
      ALLOW_LOCAL_REDIS="${resolver_allow_local}" "${REDIS_RESOLVER}" 2>/dev/null
    )"; then
      REDIS_URL="${resolved_redis_url}"
    elif [[ "${REDIS_FAIL_OPEN}" == "true" ]]; then
      REDIS_URL="${LOCAL_REDIS_URL}"
      echo "[factory-boot] WARN: redis resolver failed; using local fallback (${REDIS_URL})"
    else
      echo "[factory-boot] ERROR: redis resolver failed and REDIS_FAIL_OPEN=false"
      exit 1
    fi
  else
    echo "[factory-boot] ERROR: redis resolver missing or not executable: ${REDIS_RESOLVER}"
    exit 1
  fi
fi
RELAY_URL_WAS_EXPLICIT="false"
if [[ -n "${RELAY_URL:-${TNF_RELAY_URL:-${RELAY_WS_URL:-}}}" ]]; then
  RELAY_URL_WAS_EXPLICIT="true"
fi
RELAY_URL="${RELAY_URL:-${TNF_RELAY_URL:-${RELAY_WS_URL:-ws://127.0.0.1:${RELAY_PORT}/ws}}}"
LEDGER_API_BASE="${LEDGER_API_BASE:-${CLOUD_RUNTIME_API_URL:-${LIVE_API_BASE_URL:-${API_BASE_URL:-${TNF_API_BASE:-http://localhost:3001}}}}}"
AUTO_DETECT_CLOUD_RUNTIME_API="${AUTO_DETECT_CLOUD_RUNTIME_API:-true}"

STALL_THRESHOLD="${STALL_THRESHOLD:-45000}"
RECOVERY_INTERVAL="${RECOVERY_INTERVAL:-30000}"
SELF_PROMPT_ENABLED="${SELF_PROMPT_ENABLED:-true}"
SELF_PROMPT_COOLDOWN_MS="${SELF_PROMPT_COOLDOWN_MS:-30000}"
FACTORY_SUPERVISOR_ENABLED="${FACTORY_SUPERVISOR_ENABLED:-true}"
RELAY_ACTIVITY_PERSISTENCE_ENABLED="${RELAY_ACTIVITY_PERSISTENCE_ENABLED:-false}"
SUPERVISOR_STATE_DIR="${ROOT_DIR}/.agent/runtime-state/supervisor"
SUPERVISOR_PID_FILE="${SUPERVISOR_STATE_DIR}/supervisor.pid"

echo "[factory-boot] root=${ROOT_DIR}"
echo "[factory-boot] log_dir=${LOG_DIR}"

if [[ "${PORT_PREFLIGHT_ENABLED}" == "true" ]]; then
  port_preflight_args=("scripts/tnf-ports.cjs" "preflight")
  if [[ "${PORT_PREFLIGHT_STRICT}" == "true" ]]; then
    port_preflight_args+=("--strict")
  fi
  echo "[factory-boot] port preflight (${PORT_PREFLIGHT_STRICT})"
  if ! (cd "${ROOT_DIR}" && node "${port_preflight_args[@]}") 2>&1 | sed 's/^/[factory-boot] /'; then
    echo "[factory-boot] ERROR: port preflight failed"
    exit 1
  fi
fi

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "[factory-boot] ERROR: redis-cli not found"
  exit 1
fi

redis_url_is_local() {
  local url="$1"
  [[ "${url}" == *"localhost"* || "${url}" == *"127.0.0.1"* || "${url}" == *"::1"* ]]
}

redis_ping() {
  local url="$1"
  redis-cli -u "${url}" ping >/dev/null 2>&1
}

start_local_redis_once() {
  if [[ "${START_LOCAL_REDIS_ON_FALLBACK}" != "true" ]]; then
    return 1
  fi
  if ! command -v redis-server >/dev/null 2>&1; then
    return 1
  fi
  if redis_ping "${LOCAL_REDIS_URL}"; then
    return 0
  fi
  echo "[factory-boot] local Redis target set; starting redis-server --daemonize yes (port 6379)"
  redis-server --daemonize yes --port 6379 --bind 127.0.0.1 >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5; do
    sleep 1
    if redis_ping "${LOCAL_REDIS_URL}"; then
      return 0
    fi
  done
  return 1
}

if redis_ping "${REDIS_URL}"; then
  if redis_url_is_local "${REDIS_URL}"; then
    echo "[factory-boot] redis target=local (${REDIS_URL})"
  else
    echo "[factory-boot] redis target=remote"
  fi
else
  echo "[factory-boot] WARNING: Redis not reachable at ${REDIS_URL}"
  is_remote_target="true"
  if redis_url_is_local "${REDIS_URL}"; then
    is_remote_target="false"
  fi

  if [[ "${is_remote_target}" == "false" ]]; then
    if start_local_redis_once; then
      REDIS_URL="${LOCAL_REDIS_URL}"
      echo "[factory-boot] local Redis now reachable (${REDIS_URL})"
    elif [[ "${REDIS_FAIL_OPEN}" != "true" ]]; then
      echo "[factory-boot] ERROR: Redis unreachable and fail-open disabled"
      exit 1
    fi
  fi

  if ! redis_ping "${REDIS_URL}"; then
    if [[ "${REDIS_FAIL_OPEN}" == "true" ]]; then
      echo "[factory-boot] attempting local Redis fallback: ${LOCAL_REDIS_URL}"
      if start_local_redis_once; then
        REDIS_URL="${LOCAL_REDIS_URL}"
        echo "[factory-boot] fallback active; redis target=local (${REDIS_URL})"
      else
        echo "[factory-boot] ERROR: local Redis fallback failed (${LOCAL_REDIS_URL})"
        exit 1
      fi
    else
      echo "[factory-boot] ERROR: Redis unreachable and fail-open disabled"
      exit 1
    fi
  fi
fi
printf "%s\n" "${REDIS_URL}" > "${RUNTIME_STATE_DIR}/redis-url.txt"

if [[ "${AUTO_DETECT_CLOUD_RUNTIME_API}" == "true" ]] && [[ "${LEDGER_API_BASE}" == "http://localhost:3001" ]]; then
  if command -v cloud_runtime >/dev/null 2>&1; then
    CLOUD_RUNTIME_DOMAIN_URL="$(cloud_runtime domain 2>/dev/null | rg -o 'https://[^[:space:]]+' -m 1 || true)"
    if [[ -n "${CLOUD_RUNTIME_DOMAIN_URL}" ]]; then
      LEDGER_API_BASE="${CLOUD_RUNTIME_DOMAIN_URL}"
      echo "[factory-boot] auto-detected cloud_runtime api: ${LEDGER_API_BASE}"
    fi
  fi
fi

echo "[factory-boot] ledger_api_base=${LEDGER_API_BASE}"
printf "%s\n" "${LEDGER_API_BASE}" > "${LIVE_API_CACHE_FILE}"

if curl -fsS --max-time 2 "${LEDGER_API_BASE%/}/api/health" >/dev/null 2>&1; then
  echo "[factory-boot] ledger api healthy at ${LEDGER_API_BASE%/}/api/health"
elif curl -fsS --max-time 2 "${LEDGER_API_BASE%/}/health" >/dev/null 2>&1; then
  echo "[factory-boot] ledger api healthy at ${LEDGER_API_BASE%/}/health"
elif [[ "${LEDGER_API_BASE}" == "http://localhost:3001" ]] && curl -fsS --max-time 2 "https://api.thenewfuse.com/api/health" >/dev/null 2>&1; then
  LEDGER_API_BASE="https://api.thenewfuse.com"
  echo "[factory-boot] local ledger unavailable; using live ledger api at ${LEDGER_API_BASE}"
  printf "%s\n" "${LEDGER_API_BASE}" > "${LIVE_API_CACHE_FILE}"
else
  echo "[factory-boot] WARNING: ledger api not reachable at ${LEDGER_API_BASE} (master-clock/director persistence may degrade)"
fi

relay_health="$(curl -fsS --max-time 2 "http://localhost:${RELAY_PORT}/health" 2>/dev/null || true)"
if echo "${relay_health}" | grep -q '"relay":"running"'; then
  echo "[factory-boot] relay already healthy on :${RELAY_PORT}"
else
  can_start_relay="true"
  relay_pid_on_port="$(find_relay_pid_on_port_3000 || true)"
  port_3000_pids="$(get_port_3000_pids | tr '\n' ' ' | sed 's/[[:space:]]*$//')"

  if [[ -n "${port_3000_pids}" ]]; then
    if [[ -n "${relay_pid_on_port}" ]]; then
      if [[ "${RELAY_FORCE_RESTART}" == "true" ]]; then
        echo "[factory-boot] relay on :${RELAY_PORT} is unhealthy; force restarting pid=${relay_pid_on_port}"
        terminate_relay_pid "${relay_pid_on_port}"
      else
        echo "[factory-boot] relay on :${RELAY_PORT} is unhealthy (pid=${relay_pid_on_port}); leaving it untouched"
        echo "[factory-boot] hint: set FACTORY_BOOT_RELAY_FORCE_RESTART=true to allow forced relay restart"
        can_start_relay="false"
      fi
    else
      if [[ "${RELAY_PORT}" == "3000" ]]; then
        echo "[factory-boot] port :3000 occupied by non-relay pid(s): ${port_3000_pids}"
        RELAY_PORT="${FACTORY_BOOT_ALT_RELAY_PORT:-3010}"
        if [[ "${RELAY_URL_WAS_EXPLICIT}" != "true" ]]; then
          RELAY_URL="ws://127.0.0.1:${RELAY_PORT}/ws"
        fi
        echo "[factory-boot] using alternate relay port :${RELAY_PORT}"
        if lsof -ti :"${RELAY_PORT}" >/dev/null 2>&1; then
          echo "[factory-boot] alternate relay port :${RELAY_PORT} is occupied; skipping relay start"
          can_start_relay="false"
        fi
      else
        echo "[factory-boot] port :${RELAY_PORT} occupied by non-relay pid(s): ${port_3000_pids}"
        echo "[factory-boot] refusing to kill unknown process; skipping relay start"
        can_start_relay="false"
      fi
    fi
  fi

  if [[ "${can_start_relay}" == "true" ]]; then
    echo "[factory-boot] starting relay-core relay (compiled)"
    nohup bash -lc "cd '${ROOT_DIR}/packages/relay-core' && PORT='${RELAY_PORT}' REDIS_URL='${REDIS_URL}' ENABLE_REDIS_BRIDGE=true ENABLE_ACTIVITY_PERSISTENCE='${RELAY_ACTIVITY_PERSISTENCE_ENABLED}' ACTIVITY_PERSISTENCE_REQUIRED=false node dist/standalone-relay.js" \
      > "${LOG_DIR}/relay-dev.log" 2>&1 &
    sleep 3
  fi
fi

if pgrep -f "dist/master-clock.js|ts-node src/master-clock.ts" >/dev/null 2>&1; then
  echo "[factory-boot] master-clock already running"
else
  echo "[factory-boot] starting master-clock (compiled)"
  nohup bash -lc "cd '${ROOT_DIR}/packages/relay-core' && REDIS_URL='${REDIS_URL}' RELAY_URL='${RELAY_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' STALL_THRESHOLD='${STALL_THRESHOLD}' RECOVERY_INTERVAL='${RECOVERY_INTERVAL}' SELF_PROMPT_ENABLED='${SELF_PROMPT_ENABLED}' SELF_PROMPT_COOLDOWN_MS='${SELF_PROMPT_COOLDOWN_MS}' node dist/master-clock.js" \
    > "${LOG_DIR}/master-clock-dev.log" 2>&1 &
  sleep 3
fi

if pgrep -f "dist/broker-agent.js|ts-node src/broker-agent.ts" >/dev/null 2>&1; then
  echo "[factory-boot] broker-agent already running"
else
  echo "[factory-boot] starting broker-agent (compiled)"
  nohup bash -lc "cd '${ROOT_DIR}/packages/relay-core' && REDIS_URL='${REDIS_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' node dist/broker-agent.js" \
    > "${LOG_DIR}/broker-agent-dev.log" 2>&1 &
  sleep 2
fi

if pgrep -f "dist/director-agent.js|ts-node src/director-agent.ts" >/dev/null 2>&1; then
  echo "[factory-boot] director-agent already running"
else
  echo "[factory-boot] starting director-agent (compiled)"
  nohup bash -lc "cd '${ROOT_DIR}/packages/relay-core' && REDIS_URL='${REDIS_URL}' LEDGER_API_BASE='${LEDGER_API_BASE}' DIRECTOR_AUTO_POLICY='risk-aware' node dist/director-agent.js" \
    > "${LOG_DIR}/director-agent-dev.log" 2>&1 &
  sleep 2
fi

if pgrep -f "scripts/swarm/project-planner.cjs" >/dev/null 2>&1; then
  echo "[factory-boot] project-planner already running"
else
  echo "[factory-boot] starting project-planner"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' node scripts/swarm/project-planner.cjs" \
    > "${LOG_DIR}/project-planner.log" 2>&1 &
  sleep 2
fi

if pgrep -f "scripts/orchestrator/impetus-loop.cjs loop" >/dev/null 2>&1; then
  echo "[factory-boot] impetus-loop already running"
else
  echo "[factory-boot] starting impetus-loop"
  nohup bash -lc "cd '${ROOT_DIR}' && REDIS_URL='${REDIS_URL}' node scripts/orchestrator/impetus-loop.cjs loop" \
    > "${LOG_DIR}/impetus-loop.log" 2>&1 &
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
curl -sS --max-time 2 "http://localhost:${RELAY_PORT}/health" || true
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
echo "[factory-boot] impetus inbox:"
redis-cli -u "${REDIS_URL}" LLEN tnf:impetus:inbox || true
echo

if [[ "${FACTORY_SUPERVISOR_ENABLED}" == "true" ]]; then
  mkdir -p "${SUPERVISOR_STATE_DIR}"
  running_pid=""
  if [[ -f "${SUPERVISOR_PID_FILE}" ]]; then
    file_pid="$(cat "${SUPERVISOR_PID_FILE}" 2>/dev/null || true)"
    if [[ -n "${file_pid}" ]] && kill -0 "${file_pid}" >/dev/null 2>&1; then
      cmdline="$(ps -p "${file_pid}" -o command= 2>/dev/null || true)"
      if echo "${cmdline}" | grep -q "factory-supervisor.sh"; then
        running_pid="${file_pid}"
      fi
    fi
  fi

  if [[ -n "${running_pid}" ]]; then
    echo "[factory-boot] supervisor already running (pid=${running_pid})"
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
