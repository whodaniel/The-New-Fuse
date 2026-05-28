#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Single-instance guard — prevents duplicate supercycle loops
source "${ROOT_DIR}/scripts/lib/tnf-single-instance-guard.sh"
tnf_single_instance_guard supercycle-heartbeat-loop 300
if [[ $? -ne 0 ]]; then exit 0; fi

PROCESS_ID="${PROCESS_ID:-tnf-self-improvement-loop}"
PROCESS_NAME="${PROCESS_NAME:-tnf-self-improvement-loop}"
OWNER="${OWNER:-orchestrator}"
KIND="${KIND:-continuous-loop}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-25}"

echo "[supercycle-loop] process=${PROCESS_ID} interval=${INTERVAL_SECONDS}s"

cd "${ROOT_DIR}"

pnpm --filter @the-new-fuse/relay-core run super-cycle:event -- \
  --action register \
  --process-id "${PROCESS_ID}" \
  --name "${PROCESS_NAME}" \
  --kind "${KIND}" \
  --owner "${OWNER}" \
  --status running \
  --interval-seconds "${INTERVAL_SECONDS}" \
  --metadata "{\"channel\":\"General\",\"component\":\"self-improvement\",\"mode\":\"loop\",\"intendedIntervalSeconds\":${INTERVAL_SECONDS},\"intervalSeconds\":${INTERVAL_SECONDS},\"cadenceSeconds\":${INTERVAL_SECONDS}}" >/dev/null

while true; do
  tick="$(date +%s)"
  pnpm --filter @the-new-fuse/relay-core run super-cycle:event -- \
    --action heartbeat \
    --process-id "${PROCESS_ID}" \
    --status running \
    --result success \
    --interval-seconds "${INTERVAL_SECONDS}" \
    --metadata "{\"tick\":\"${tick}\",\"channel\":\"General\",\"intendedIntervalSeconds\":${INTERVAL_SECONDS},\"intervalSeconds\":${INTERVAL_SECONDS},\"cadenceSeconds\":${INTERVAL_SECONDS}}" >/dev/null || true
  sleep "${INTERVAL_SECONDS}"
done
