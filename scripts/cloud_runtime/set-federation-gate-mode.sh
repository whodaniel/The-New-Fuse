#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

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
  CLOUD_RUNTIME_API_SERVICE / CLOUD_RUNTIME_RELAY_SERVICE  Cloud Run service names
  TNF_GCP_PROJECT_ID / TNF_GCP_REGION                       GCP target (defaults set in tnf-cloud-run.sh)
  TNF_GATE_POLICY_ENDPOINT External gate endpoint
  TNF_GATE_POLICY_TOKEN    Optional gate auth token
  WAIT_FOR_SUCCESS         1 to wait for ready services, 0 to skip (default: 1)
  WAIT_TIMEOUT_SECONDS     Max wait time (default: 600)
  WAIT_POLL_SECONDS        Poll interval (default: 10)
  APPLY_API                1 apply to API service, 0 skip (default: 1)
  APPLY_RELAY              1 apply to relay service, 0 skip (default: 1)
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

tnf_require_gcloud

echo "Applying federation gate mode: ${MODE}"
echo "- project/region: $(tnf_gcp_project) / $(tnf_gcp_region)"
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
  tnf_cloud_run_update_env "${API_SERVICE}" "${api_vars[@]}"
fi
if [[ "${APPLY_RELAY}" == "1" ]]; then
  tnf_cloud_run_update_env "${RELAY_SERVICE}" "${relay_vars[@]}"
fi

echo
echo "Verifying variables (non-secret fields):"
if [[ "${APPLY_API}" == "1" ]]; then
  tnf_cloud_run_env_json "${API_SERVICE}" \
    | jq -r 'to_entries[] | select(.key|test("^TNF_GATE_POLICY_(MODE|ENDPOINT)$")) | "api \(.key)=\(.value)"'
fi
if [[ "${APPLY_RELAY}" == "1" ]]; then
  tnf_cloud_run_env_json "${RELAY_SERVICE}" \
    | jq -r 'to_entries[] | select(.key|test("^(BROKER_FEDERATION_GATE_MODE|BROKER_GATE_POLICY_ENDPOINT|BROKER_CONTEXT_RISK_ESCALATION_LEVEL|BROKER_TWIP_SNAPSHOT_CACHE_MS|BROKER_TWIP_INVENTORY_SNAPSHOT_PATH|BROKER_MAX_TWIP_CONTEXT_AGE_MS|BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND|TNF_GATE_POLICY_MODE|TNF_GATE_POLICY_ENDPOINT)$")) | "relay \(.key)=\(.value)"'
fi

if [[ "${WAIT_FOR_SUCCESS}" != "1" ]]; then
  echo
  echo "Skipping deployment wait (WAIT_FOR_SUCCESS=${WAIT_FOR_SUCCESS})."
  exit 0
fi

echo
echo "Waiting for Cloud Run services to become ready..."
max_attempts=$(( WAIT_TIMEOUT_SECONDS / WAIT_POLL_SECONDS ))
if [[ "${max_attempts}" -lt 1 ]]; then max_attempts=1; fi

if [[ "${APPLY_API}" == "1" ]]; then
  tnf_cloud_run_wait_ready "${API_SERVICE}" "${max_attempts}" "${WAIT_POLL_SECONDS}"
fi
if [[ "${APPLY_RELAY}" == "1" ]]; then
  tnf_cloud_run_wait_ready "${RELAY_SERVICE}" "${max_attempts}" "${WAIT_POLL_SECONDS}"
fi

echo
echo "Federation gate mode rollout complete."
