#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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
  --metadata "{\"channel\":\"General\",\"component\":\"self-improvement\",\"mode\":\"loop\",\"intervalSeconds\":${INTERVAL_SECONDS},\"cadenceSeconds\":${INTERVAL_SECONDS}}" >/dev/null

while true; do
  tick="$(date +%s)"
  pnpm --filter @the-new-fuse/relay-core run super-cycle:event -- \
    --action heartbeat \
    --process-id "${PROCESS_ID}" \
    --status running \
    --result success \
    --metadata "{\"tick\":\"${tick}\",\"channel\":\"General\",\"intervalSeconds\":${INTERVAL_SECONDS},\"cadenceSeconds\":${INTERVAL_SECONDS}}" >/dev/null || true
  sleep "${INTERVAL_SECONDS}"
done
