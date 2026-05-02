#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

API_BASE="${AGENT_REGISTRY_API_BASE:-http://localhost:3004}"
HEALTH_PATH="${AGENT_REGISTRY_HEALTH_PATH:-/health}"
START_CMD="${AGENT_REGISTRY_START_CMD:-pnpm --filter @the-new-fuse/backend-app dev}"
SKIP_START="${AGENT_REGISTRY_SKIP_START:-}"
WAIT_SECONDS="${AGENT_REGISTRY_WAIT_SECONDS:-60}"
LOG_FILE="${AGENT_REGISTRY_LOG_FILE:-/tmp/tnf-agent-registry-backend.log}"

say() { printf "%s\n" "$*"; }

backend_pid=""
cleanup() {
  if [ -n "$backend_pid" ]; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

say "[registry] building snapshot"
node scripts/agent-registry/build-agent-registry.mjs

if curl -fsS "${API_BASE}${HEALTH_PATH}" >/dev/null 2>&1; then
  say "[registry] backend already healthy at ${API_BASE}${HEALTH_PATH}"
else
  if [ -n "$SKIP_START" ]; then
    say "[registry] backend not healthy and AGENT_REGISTRY_SKIP_START=1; aborting"
    exit 1
  fi
  say "[registry] starting backend via: $START_CMD"
  bash -lc "$START_CMD" >"$LOG_FILE" 2>&1 &
  backend_pid=$!

  say "[registry] waiting for health (${WAIT_SECONDS}s max)"
  for i in $(seq 1 "$WAIT_SECONDS"); do
    if curl -fsS "${API_BASE}${HEALTH_PATH}" >/dev/null 2>&1; then
      say "[registry] backend healthy"
      break
    fi
    sleep 1
  done

  if ! curl -fsS "${API_BASE}${HEALTH_PATH}" >/dev/null 2>&1; then
    say "[registry] backend did not become healthy; tailing log: ${LOG_FILE}"
    tail -n 200 "$LOG_FILE" || true
    exit 1
  fi
fi

say "[registry] importing snapshot"
AGENT_REGISTRY_API_BASE="$API_BASE" node scripts/agent-registry/import-agent-registry-snapshot.mjs
say "[registry] import complete"
