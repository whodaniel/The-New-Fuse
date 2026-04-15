#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SERVICE_LOG_DIR="$ROOT_DIR/.agent/runtime-logs/qa-swarm-service"
HEARTBEAT_FILE="$SERVICE_LOG_DIR/heartbeat.json"
mkdir -p "$SERVICE_LOG_DIR"

export TEST_ENABLE_IMPROVER="${TEST_ENABLE_IMPROVER:-0}"
export TEST_LOOP_INTERVAL="${TEST_LOOP_INTERVAL:-300000}"
export TEST_TARGET_SCORE="${TEST_TARGET_SCORE:-95}"
export TEST_CONTINUE_AFTER_TARGET="${TEST_CONTINUE_AFTER_TARGET:-1}"
export TEST_AGENT_TIMEOUT_MS="${TEST_AGENT_TIMEOUT_MS:-900000}"
export TEST_STRICT_TYPECHECK="${TEST_STRICT_TYPECHECK:-0}"
export TEST_TIMEOUT_TYPECHECK_MS="${TEST_TIMEOUT_TYPECHECK_MS:-180000}"
export TEST_TIMEOUT_LINT_MS="${TEST_TIMEOUT_LINT_MS:-180000}"
export TEST_TIMEOUT_BUILD_MS="${TEST_TIMEOUT_BUILD_MS:-300000}"
export TEST_TIMEOUT_UNIT_MS="${TEST_TIMEOUT_UNIT_MS:-180000}"
export TEST_HEARTBEAT_INTERVAL_SEC="${TEST_HEARTBEAT_INTERVAL_SEC:-15}"

write_heartbeat() {
  local status="$1"
  local child_pid="${2:-null}"
  local exit_code="${3:-null}"
  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  cat >"$HEARTBEAT_FILE" <<EOF
{
  "timestamp": "${now}",
  "status": "${status}",
  "supervisorPid": $$,
  "childPid": ${child_pid},
  "exitCode": ${exit_code},
  "rootDir": "${ROOT_DIR}",
  "testLoopInterval": "${TEST_LOOP_INTERVAL}",
  "targetScore": "${TEST_TARGET_SCORE}",
  "continueAfterTarget": "${TEST_CONTINUE_AFTER_TARGET}",
  "enableImprover": "${TEST_ENABLE_IMPROVER}"
}
EOF
}

pnpm -C "$ROOT_DIR" run test:continuous &
child_pid=$!
write_heartbeat "running" "${child_pid}" "null"

trap 'write_heartbeat "stopping" "'"${child_pid}"'" "null"; kill "'"${child_pid}"'" >/dev/null 2>&1 || true; exit 0' INT TERM

while kill -0 "$child_pid" >/dev/null 2>&1; do
  write_heartbeat "running" "${child_pid}" "null"
  sleep "$TEST_HEARTBEAT_INTERVAL_SEC"
done

wait "$child_pid"
exit_code=$?
write_heartbeat "stopped" "null" "${exit_code}"
exit "$exit_code"
