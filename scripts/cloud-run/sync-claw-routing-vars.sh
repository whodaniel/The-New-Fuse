#!/usr/bin/env bash
# Sync TNF LLM routing env vars onto Cloud Run OpenClaw/ZeroClaw services.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

BASE_URL="${TNF_LLM_ROUTING_API_BASE:-https://api-production-48f1.thenewfuse.com}"
MAX_RETRIES="${MAX_RETRIES:-8}"
SLEEP_SECONDS="${SLEEP_SECONDS:-4}"

services=(
  "zeroclaw-sandbox:zeroclaw-sandbox"
  "picoclaw-perplexity:picoclaw-perplexity"
  "picoclaw-subject:picoclaw-subject"
  "picoclaw-tester:picoclaw-tester"
  "picoclaw-tester-v2:picoclaw-tester-v2"
)

tnf_require_gcloud

echo "Starting claw routing variable sync (Cloud Run)"
echo "TNF_LLM_ROUTING_API_BASE=${BASE_URL}"
echo "Project/region: $(tnf_gcp_project) / $(tnf_gcp_region)"
echo "MAX_RETRIES=${MAX_RETRIES}, SLEEP_SECONDS=${SLEEP_SECONDS}"
echo

failed=0

for pair in "${services[@]}"; do
  service="${pair%%:*}"
  target="${pair##*:}"
  echo "== ${service} =="
  ok=0

  for attempt in $(seq 1 "${MAX_RETRIES}"); do
    echo "attempt ${attempt}/${MAX_RETRIES}"
    if tnf_cloud_run_update_env "${service}" \
      "TNF_LLM_ROUTING_API_BASE=${BASE_URL}" \
      "TNF_LLM_TARGET=${target}"; then
      echo "OK: ${service}"
      ok=1
      break
    fi
    sleep "${SLEEP_SECONDS}"
  done

  if [[ "${ok}" -ne 1 ]]; then
    echo "FAIL: ${service}"
    failed=$((failed + 1))
  fi
  echo
done

if [[ "${failed}" -gt 0 ]]; then
  echo "ERROR: ${failed} service(s) failed routing sync."
  exit 1
fi

echo "All routing vars synced."
