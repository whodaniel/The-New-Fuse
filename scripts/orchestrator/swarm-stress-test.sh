#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Endpoint authority (#176): resolve public/app endpoints from the generated
# adaptive harness context; explicit env still wins.
# shellcheck disable=SC1091
. "${ROOT_DIR}/scripts/runtime/harness-context-env.sh"
TNF_APP_BASE="${TNF_APP_BASE_URL:-$(harness_ctx_get TNF_APP_BASE_URL https://app.thenewfuse.com)}"
TNF_PUBLIC_BASE_URL="${TNF_PUBLIC_BASE:-$(harness_ctx_get TNF_PUBLIC_BASE https://thenewfuse.com)}"

# --- Singleton lock: prevent duplicate concurrent runs from multiple agents ---
source "${ROOT_DIR}/scripts/lib/tnf-lock.sh"
tnf_acquire_lock "swarm-stress-test" 600

# --- Fleet-wide pause gate (2026-07-21) ---
source "${ROOT_DIR}/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

STRESS_LOG="${ROOT_DIR}/.agent/runtime-logs/swarm-stress-test.log"
STATE_FILE="${ROOT_DIR}/.agent/runtime-state/swarm-stress/state.json"
mkdir -p "$(dirname "${STRESS_LOG}")" "$(dirname "${STATE_FILE}")"

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(stamp)] $*" >> "${STRESS_LOG}"; echo "$*"; }

TIMESTAMP=$(stamp)
PASS=true
RESULTS_JSON="{"

# Test 1: app host main page (harness-context authority)
log "Testing ${TNF_APP_BASE}..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${TNF_APP_BASE}" 2>/dev/null); then
    log "  Status: ${HTTP_CODE}"
    RESULTS_JSON="${RESULTS_JSON}\"app_tnf\": \"${HTTP_CODE}\""
else
    log "  FAILED to reach ${TNF_APP_BASE}"
    RESULTS_JSON="${RESULTS_JSON}\"app_tnf\": \"failed\""
    PASS=false
fi

# Test 2: public landing page (harness-context authority)
log "Testing ${TNF_PUBLIC_BASE_URL}..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${TNF_PUBLIC_BASE_URL}" 2>/dev/null); then
    log "  Status: ${HTTP_CODE}"
    RESULTS_JSON="${RESULTS_JSON},\"tnf_com\": \"${HTTP_CODE}\""
else
    log "  FAILED to reach ${TNF_PUBLIC_BASE_URL}"
    RESULTS_JSON="${RESULTS_JSON},\"tnf_com\": \"failed\""
    PASS=false
fi

# Test 3: Marketplace API (app host from harness context)
log "Testing marketplace API..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${TNF_APP_BASE}/api/marketplace/catalog" 2>/dev/null); then
    log "  Status: ${HTTP_CODE}"
    RESULTS_JSON="${RESULTS_JSON},\"marketplace_api\": \"${HTTP_CODE}\""
else
    log "  FAILED marketplace API"
    RESULTS_JSON="${RESULTS_JSON},\"marketplace_api\": \"failed\""
    PASS=false
fi

# Test 4: Local relay health
log "Testing local relay (ws://localhost:3000)..."
if curl -s -o /dev/null --max-time 5 "http://localhost:3000/health" 2>/dev/null; then
    RELAY_STATUS=$(curl -s --max-time 5 "http://localhost:3000/health" 2>/dev/null || echo "ok")
    log "  Relay healthy"
    RESULTS_JSON="${RESULTS_JSON},\"relay_health\": \"healthy\""
else
    log "  Relay not responding"
    RESULTS_JSON="${RESULTS_JSON},\"relay_health\": \"unreachable\""
    PASS=false
fi

# Test 5: GitHub connectivity
log "Testing GitHub connectivity..."
cd "${ROOT_DIR}"
if git fetch --dry-run 2>/dev/null; then
    log "  GitHub reachable"
    RESULTS_JSON="${RESULTS_JSON},\"github\": \"reachable\""
else
    log "  GitHub unreachable"
    RESULTS_JSON="${RESULTS_JSON},\"github\": \"unreachable\""
fi

RESULTS_JSON="${RESULTS_JSON},\"timestamp\": \"${TIMESTAMP}\",\"pass\": ${PASS}}"
echo "${RESULTS_JSON}" > "${STATE_FILE}"

if [[ "${PASS}" == "true" ]]; then
    log "All stress tests PASSED."
    exit 0
else
    log "Some stress tests FAILED."
    exit 1
fi