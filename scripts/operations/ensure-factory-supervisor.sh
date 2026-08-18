#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
STATE_DIR="${ROOT_DIR}/.agent/runtime-state/supervisor"
PID_FILE="${STATE_DIR}/supervisor.pid"

mkdir -p "${LOG_DIR}" "${STATE_DIR}"

if [[ -f "${PID_FILE}" ]]; then
  pid="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
    cmdline="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
    if echo "${cmdline}" | grep -q "factory-supervisor.sh"; then
      echo "[ensure-factory-supervisor] already running pid=${pid}"
      exit 0
    fi
  fi
  rm -f "${PID_FILE}"
fi

echo "[ensure-factory-supervisor] starting factory-supervisor"
nohup bash -lc "cd '${ROOT_DIR}' && scripts/orchestrator/factory-supervisor.sh" \
  >> "${LOG_DIR}/factory-supervisor.log" 2>&1 &
sleep 1
echo "[ensure-factory-supervisor] start requested"
