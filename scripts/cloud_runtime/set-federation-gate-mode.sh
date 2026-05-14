#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-warn}"
ENVIRONMENT="${CLOUD_RUNTIME_ENVIRONMENT:-production}"
API_SERVICE="${CLOUD_RUNTIME_API_SERVICE:-api}"
RELAY_SERVICE="${CLOUD_RUNTIME_RELAY_SERVICE:-relay-server}"
ENDPOINT="${TNF_GATE_POLICY_ENDPOINT:-https://tnf-sharedstate.bizsynth.workers.dev}"
TOKEN="${TNF_GATE_POLICY_TOKEN:-}"
WAIT_FOR_SUCCESS="${WAIT_FOR_SUCCESS:-1}"
WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-600}"
WAIT_POLL_SECONDS="${WAIT_POLL_SECONDS:-10}"
APPLY_API="${APPLY_API:-1}"
APPLY_RELAY="${APPLY_RELAY:-1}"
CONTEXT_RISK_ESCALATION_LEVEL="${BROKER_CONTEXT_RISK_ESCALATION_LEVEL:-high}"
TWIP_SNAPSHOT_CACHE_MS="${BROKER_TWIP_SNAPSHOT_CACHE_MS:-15000}"
TWIP_INVENTORY_SNAPSHOT_PATH="${BROKER_TWIP_INVENTORY_SNAPSHOT_PATH:-}"
MAX_TWIP_CONTEXT_AGE_MS="${BROKER_MAX_TWIP_CONTEXT_AGE_MS:-900000}"
REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND="${BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND:-false}"

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/cloud_runtime/set-federation-gate-mode.sh [off|warn|enforce]

Environment overrides:
  CLOUD_RUNTIME_ENVIRONMENT      CloudRuntime environment (default: production)
  CLOUD_RUNTIME_API_SERVICE      API service name (default: api)
  CLOUD_RUNTIME_RELAY_SERVICE    Relay service name (default: relay-server)
  TNF_GATE_POLICY_ENDPOINT External gate endpoint
  TNF_GATE_POLICY_TOKEN    Optional gate auth token
  WAIT_FOR_SUCCESS         1 to wait for success deployments, 0 to skip (default: 1)
  WAIT_TIMEOUT_SECONDS     Max wait time (default: 600)
  WAIT_POLL_SECONDS        Poll interval (default: 10)
  APPLY_API                1 apply to API service, 0 skip (default: 1)
  APPLY_RELAY              1 apply to relay service, 0 skip (default: 1)
  BROKER_CONTEXT_RISK_ESCALATION_LEVEL Context risk threshold (low|medium|high|critical; default: high)
  BROKER_TWIP_SNAPSHOT_CACHE_MS        TWIP snapshot cache ms for broker (default: 15000)
  BROKER_TWIP_INVENTORY_SNAPSHOT_PATH  Optional explicit TWIP snapshot path for broker runtime
  BROKER_MAX_TWIP_CONTEXT_AGE_MS       Max TWIP context age in ms before stale (default: 900000)
  BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND true|false require context availability for terminal-bound tasks
USAGE
}

if [[ "${MODE}" == "--help" || "${MODE}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "${MODE}" != "off" && "${MODE}" != "warn" && "${MODE}" != "enforce" ]]; then
  echo "ERROR: mode must be one of: off, warn, enforce"
  usage
  exit 1
fi

if [[ "${APPLY_API}" != "1" && "${APPLY_API}" != "0" ]]; then
  echo "ERROR: APPLY_API must be 0 or 1"
  exit 1
fi
if [[ "${APPLY_RELAY}" != "1" && "${APPLY_RELAY}" != "0" ]]; then
  echo "ERROR: APPLY_RELAY must be 0 or 1"
  exit 1
fi
if [[ "${APPLY_API}" == "0" && "${APPLY_RELAY}" == "0" ]]; then
  echo "ERROR: nothing to do; both APPLY_API and APPLY_RELAY are 0"
  exit 1
fi

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "ERROR: cloud_runtime CLI is not installed."
  exit 1
fi

whoami_output="$(cloud_runtime whoami 2>&1 || true)"
if [[ -z "${whoami_output}" ]]; then
  echo "ERROR: unable to determine cloud_runtime auth state."
  exit 1
fi
if echo "${whoami_output}" | grep -qi "login\|not authenticated\|Unauthorized"; then
  echo "ERROR: cloud_runtime CLI is not authenticated (run: cloud_runtime login)."
  exit 1
fi

echo "Applying federation gate mode: ${MODE}"
echo "- environment: ${ENVIRONMENT}"
echo "- api service: ${API_SERVICE}"
echo "- relay service: ${RELAY_SERVICE}"
echo "- endpoint: ${ENDPOINT}"
echo "- apply api: ${APPLY_API}"
echo "- apply relay: ${APPLY_RELAY}"
echo "- context risk escalation: ${CONTEXT_RISK_ESCALATION_LEVEL}"
echo "- twip snapshot cache ms: ${TWIP_SNAPSHOT_CACHE_MS}"
echo "- twip max context age ms: ${MAX_TWIP_CONTEXT_AGE_MS}"
echo "- require twip context for terminal-bound: ${REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND}"
echo

api_vars=(
  "TNF_GATE_POLICY_MODE=${MODE}"
  "TNF_GATE_POLICY_ENDPOINT=${ENDPOINT}"
)

relay_vars=(
  "BROKER_FEDERATION_GATE_MODE=${MODE}"
  "BROKER_GATE_POLICY_ENDPOINT=${ENDPOINT}"
  "TNF_GATE_POLICY_MODE=${MODE}"
  "TNF_GATE_POLICY_ENDPOINT=${ENDPOINT}"
  "BROKER_CONTEXT_RISK_ESCALATION_LEVEL=${CONTEXT_RISK_ESCALATION_LEVEL}"
  "BROKER_TWIP_SNAPSHOT_CACHE_MS=${TWIP_SNAPSHOT_CACHE_MS}"
  "BROKER_MAX_TWIP_CONTEXT_AGE_MS=${MAX_TWIP_CONTEXT_AGE_MS}"
  "BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND=${REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND}"
)

if [[ -n "${TOKEN}" ]]; then
  api_vars+=("TNF_GATE_POLICY_TOKEN=${TOKEN}")
  relay_vars+=("BROKER_GATE_POLICY_TOKEN=${TOKEN}" "TNF_GATE_POLICY_TOKEN=${TOKEN}")
fi
if [[ -n "${TWIP_INVENTORY_SNAPSHOT_PATH}" ]]; then
  relay_vars+=("BROKER_TWIP_INVENTORY_SNAPSHOT_PATH=${TWIP_INVENTORY_SNAPSHOT_PATH}")
fi

if [[ "${APPLY_API}" == "1" ]]; then
  cloud_runtime variable set -s "${API_SERVICE}" -e "${ENVIRONMENT}" "${api_vars[@]}"
fi
if [[ "${APPLY_RELAY}" == "1" ]]; then
  cloud_runtime variable set -s "${RELAY_SERVICE}" -e "${ENVIRONMENT}" "${relay_vars[@]}"
fi

echo
echo "Verifying variables (non-secret fields):"
if [[ "${APPLY_API}" == "1" ]]; then
  cloud_runtime variable list -s "${API_SERVICE}" -e "${ENVIRONMENT}" --kv \
    | awk -F= '/^(TNF_GATE_POLICY_MODE|TNF_GATE_POLICY_ENDPOINT)=/{print "api " $1 "=" $2}'
fi
if [[ "${APPLY_RELAY}" == "1" ]]; then
  cloud_runtime variable list -s "${RELAY_SERVICE}" -e "${ENVIRONMENT}" --kv \
    | awk -F= '/^(BROKER_FEDERATION_GATE_MODE|BROKER_GATE_POLICY_ENDPOINT|BROKER_CONTEXT_RISK_ESCALATION_LEVEL|BROKER_TWIP_SNAPSHOT_CACHE_MS|BROKER_TWIP_INVENTORY_SNAPSHOT_PATH|BROKER_MAX_TWIP_CONTEXT_AGE_MS|BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND|TNF_GATE_POLICY_MODE|TNF_GATE_POLICY_ENDPOINT)=/{print "relay " $1 "=" $2}'
fi

if [[ "${WAIT_FOR_SUCCESS}" != "1" ]]; then
  echo
  echo "Skipping deployment wait (WAIT_FOR_SUCCESS=${WAIT_FOR_SUCCESS})."
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo
  echo "WARNING: jq not found; skipping status wait."
  exit 0
fi

echo
echo "Waiting for deployment success..."
start_ts="$(date +%s)"

while true; do
  status_json="$(cloud_runtime service status -a --json)"
  api_line="$(echo "${status_json}" | jq -r ".[] | select(.name==\"${API_SERVICE}\") | \"\(.status) \(.deploymentId)\"")"
  relay_line="$(echo "${status_json}" | jq -r ".[] | select(.name==\"${RELAY_SERVICE}\") | \"\(.status) \(.deploymentId)\"")"
  now_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if [[ "${APPLY_API}" == "1" && "${APPLY_RELAY}" == "1" ]]; then
    echo "${now_iso} api=${api_line} relay=${relay_line}"
  elif [[ "${APPLY_API}" == "1" ]]; then
    echo "${now_iso} api=${api_line}"
  else
    echo "${now_iso} relay=${relay_line}"
  fi

  api_status="$(echo "${api_line}" | awk '{print $1}')"
  relay_status="$(echo "${relay_line}" | awk '{print $1}')"

  api_ok=1
  relay_ok=1
  if [[ "${APPLY_API}" == "1" ]]; then
    if [[ "${api_status}" != "SUCCESS" ]]; then api_ok=0; fi
  fi
  if [[ "${APPLY_RELAY}" == "1" ]]; then
    if [[ "${relay_status}" != "SUCCESS" ]]; then relay_ok=0; fi
  fi
  if [[ "${api_ok}" == "1" && "${relay_ok}" == "1" ]]; then
    break
  fi

  api_failed=0
  relay_failed=0
  if [[ "${APPLY_API}" == "1" && "${api_status}" == "FAILED" ]]; then api_failed=1; fi
  if [[ "${APPLY_RELAY}" == "1" && "${relay_status}" == "FAILED" ]]; then relay_failed=1; fi
  if [[ "${api_failed}" == "1" || "${relay_failed}" == "1" ]]; then
    echo "ERROR: Deployment failed for one or more services."
    exit 2
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if (( elapsed > WAIT_TIMEOUT_SECONDS )); then
    echo "ERROR: Timed out waiting for success after ${WAIT_TIMEOUT_SECONDS}s."
    exit 3
  fi
  sleep "${WAIT_POLL_SECONDS}"
done

echo
echo "Federation gate mode rollout complete."
