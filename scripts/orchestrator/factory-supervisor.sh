#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
STATE_DIR="${ROOT_DIR}/.agent/runtime-state/supervisor"
SUPERVISOR_LOG="${LOG_DIR}/factory-supervisor.log"
PID_FILE="${STATE_DIR}/supervisor.pid"

CHECK_INTERVAL_SEC="${CHECK_INTERVAL_SEC:-15}"
BASE_BACKOFF_SEC="${BASE_BACKOFF_SEC:-5}"
MAX_BACKOFF_SEC="${MAX_BACKOFF_SEC:-120}"
LOG_FRESHNESS_SEC="${LOG_FRESHNESS_SEC:-180}"
SUPERVISOR_ONCE="${SUPERVISOR_ONCE:-false}"

mkdir -p "${LOG_DIR}" "${STATE_DIR}"

stamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
  local level="$1"
  local msg="$2"
  local line
  line="$(printf "[%s] [factory-supervisor] [%s] %s\n" "$(stamp)" "${level}" "${msg}")"
  printf "%s\n" "${line}" >> "${SUPERVISOR_LOG}"
  if [[ -t 1 ]]; then
    printf "%s\n" "${line}"
  fi
}

state_file() {
  local key="$1"
  printf "%s/%s" "${STATE_DIR}" "${key}"
}

read_int() {
  local path="$1"
  local default_value="$2"
  if [[ -f "${path}" ]]; then
    cat "${path}" 2>/dev/null || echo "${default_value}"
  else
    echo "${default_value}"
  fi
}

write_int() {
  local path="$1"
  local value="$2"
  printf "%s\n" "${value}" > "${path}"
}

now_epoch() {
  date +%s
}

pow2() {
  local exp="$1"
  local result=1
  local i=0
  while (( i < exp )); do
    result=$(( result * 2 ))
    i=$(( i + 1 ))
  done
  echo "${result}"
}

compute_backoff() {
  local failure_count="$1"
  if (( failure_count <= 1 )); then
    echo "${BASE_BACKOFF_SEC}"
    return
  fi
  local factor
  factor="$(pow2 $(( failure_count - 1 )))"
  local delay=$(( BASE_BACKOFF_SEC * factor ))
  if (( delay > MAX_BACKOFF_SEC )); then
    delay="${MAX_BACKOFF_SEC}"
  fi
  echo "${delay}"
}

file_mtime_epoch() {
  local file="$1"
  if stat -f %m "${file}" >/dev/null 2>&1; then
    stat -f %m "${file}"
  elif stat -c %Y "${file}" >/dev/null 2>&1; then
    stat -c %Y "${file}"
  else
    echo 0
  fi
}

is_log_fresh() {
  local log_file="$1"
  if [[ ! -f "${log_file}" ]]; then
    return 1
  fi
  local now
  now="$(now_epoch)"
  local mtime
  mtime="$(file_mtime_epoch "${log_file}")"
  local age=$(( now - mtime ))
  (( age >= 0 && age <= LOG_FRESHNESS_SEC ))
}

process_running() {
  local pattern="$1"
  if pgrep -f "${pattern}" >/dev/null 2>&1; then
    return 0
  fi
  local pgrep_err
  pgrep_err="$(pgrep -f "${pattern}" 2>&1 || true)"
  if echo "${pgrep_err}" | grep -q "Cannot get process list"; then
    return 2
  fi
  return 1
}

service_healthy() {
  local service="$1"
  case "${service}" in
    relay)
      curl -fsS --max-time 2 http://localhost:3000/health >/dev/null 2>&1
      ;;
    master-clock)
      process_running "ts-node src/master-clock.ts"
      local status=$?
      if (( status == 2 )); then
        is_log_fresh "${LOG_DIR}/master-clock-dev.log"
      else
        return "${status}"
      fi
      ;;
    broker-agent)
      process_running "ts-node src/broker-agent.ts"
      local status=$?
      if (( status == 2 )); then
        is_log_fresh "${LOG_DIR}/broker-agent-dev.log"
      else
        return "${status}"
      fi
      ;;
    director-agent)
      process_running "ts-node src/director-agent.ts"
      local status=$?
      if (( status == 2 )); then
        is_log_fresh "${LOG_DIR}/director-agent-dev.log"
      else
        return "${status}"
      fi
      ;;
    workflow-router)
      process_running "ts-node --compiler-options.*src/orchestrator/start.ts"
      local status=$?
      if (( status == 2 )); then
        is_log_fresh "${LOG_DIR}/workflow-router.log"
      else
        return "${status}"
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

collect_unhealthy() {
  local unhealthy=""
  local services="relay master-clock broker-agent director-agent workflow-router"
  local service
  for service in ${services}; do
    if ! service_healthy "${service}"; then
      if [[ -n "${unhealthy}" ]]; then
        unhealthy="${unhealthy},"
      fi
      unhealthy="${unhealthy}${service}"
    fi
  done
  echo "${unhealthy}"
}

if [[ -f "${PID_FILE}" ]]; then
  existing_pid="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ -n "${existing_pid}" ]] && kill -0 "${existing_pid}" >/dev/null 2>&1; then
    log "info" "supervisor already running with pid=${existing_pid}; exiting duplicate start"
    exit 0
  fi
fi

printf "%s\n" "$$" > "${PID_FILE}"
trap 'rm -f "${PID_FILE}"' EXIT INT TERM

log "info" "starting supervisor loop (check_interval=${CHECK_INTERVAL_SEC}s, base_backoff=${BASE_BACKOFF_SEC}s, max_backoff=${MAX_BACKOFF_SEC}s)"

FAILURES_FILE="$(state_file failures.count)"
NEXT_RETRY_FILE="$(state_file next-retry.epoch)"
write_int "${FAILURES_FILE}" "$(read_int "${FAILURES_FILE}" 0)"
write_int "${NEXT_RETRY_FILE}" "$(read_int "${NEXT_RETRY_FILE}" 0)"

while true; do
  unhealthy_services="$(collect_unhealthy)"
  if [[ -z "${unhealthy_services}" ]]; then
    if [[ "$(read_int "${FAILURES_FILE}" 0)" != "0" ]]; then
      log "info" "all services healthy again; resetting failure counter"
    fi
    write_int "${FAILURES_FILE}" 0
    write_int "${NEXT_RETRY_FILE}" 0
    log "debug" "health check passed"
  else
    now="$(now_epoch)"
    next_retry="$(read_int "${NEXT_RETRY_FILE}" 0)"
    if (( now < next_retry )); then
      wait_sec=$(( next_retry - now ))
      log "warn" "services unhealthy (${unhealthy_services}); waiting ${wait_sec}s before next recovery attempt"
    else
      failures=$(( $(read_int "${FAILURES_FILE}" 0) + 1 ))
      write_int "${FAILURES_FILE}" "${failures}"
      delay="$(compute_backoff "${failures}")"
      write_int "${NEXT_RETRY_FILE}" "$(( now + delay ))"

      log "warn" "services unhealthy (${unhealthy_services}); running factory:boot recovery attempt #${failures}"
      if bash "${ROOT_DIR}/scripts/orchestrator/factory-boot.sh" >> "${SUPERVISOR_LOG}" 2>&1; then
        log "info" "factory:boot recovery executed (next backoff window ${delay}s if failures persist)"
      else
        log "error" "factory:boot recovery failed (backoff ${delay}s)"
      fi
    fi
  fi

  if [[ "${SUPERVISOR_ONCE}" == "true" ]]; then
    log "info" "SUPERVISOR_ONCE=true set, exiting after single cycle"
    exit 0
  fi

  sleep "${CHECK_INTERVAL_SEC}"
done
