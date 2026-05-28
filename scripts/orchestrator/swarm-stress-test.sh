#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# --- Singleton lock: prevent duplicate concurrent runs from multiple agents ---
source "${ROOT_DIR}/scripts/lib/tnf-lock.sh"
tnf_acquire_lock "swarm-stress-test" 600

STRESS_LOG="${ROOT_DIR}/.agent/runtime-logs/swarm-stress-test.log"
STATE_FILE="${ROOT_DIR}/.agent/runtime-state/swarm-stress/state.json"
mkdir -p "$(dirname "${STRESS_LOG}")" "$(dirname "${STATE_FILE}")"

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(stamp)] $*" >> "${STRESS_LOG}"; echo "$*"; }

TIMESTAMP=$(stamp)
PASS=true
RESULTS_JSON="{"

# Test 1: app.thenewfuse.com main page
log "Testing app.thenewfuse.com..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://app.thenewfuse.com" 2>/dev/null); then
    log "  Status: ${HTTP_CODE}"
    RESULTS_JSON="${RESULTS_JSON}\"app_tnf\": \"${HTTP_CODE}\""
else
    log "  FAILED to reach app.thenewfuse.com"
    RESULTS_JSON="${RESULTS_JSON}\"app_tnf\": \"failed\""
    PASS=false
fi

# Test 2: thenewfuse.com landing page
log "Testing thenewfuse.com..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://thenewfuse.com" 2>/dev/null); then
    log "  Status: ${HTTP_CODE}"
    RESULTS_JSON="${RESULTS_JSON},\"tnf_com\": \"${HTTP_CODE}\""
else
    log "  FAILED to reach thenewfuse.com"
    RESULTS_JSON="${RESULTS_JSON},\"tnf_com\": \"failed\""
    PASS=false
fi

# Test 3: Marketplace API
log "Testing marketplace API..."
if HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://app.thenewfuse.com/api/marketplace/catalog" 2>/dev/null); then
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