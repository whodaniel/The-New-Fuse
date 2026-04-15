#!/usr/bin/env bash

set -u

BASE_URL="${TNF_LLM_ROUTING_API_BASE:-https://api-production-48f1.up.railway.app}"
MAX_RETRIES="${MAX_RETRIES:-8}"
SLEEP_SECONDS="${SLEEP_SECONDS:-4}"

services=(
  "zeroclaw-sandbox:zeroclaw-sandbox"
  "picoclaw-perplexity:picoclaw-perplexity"
  "picoclaw-subject:picoclaw-subject"
  "picoclaw-tester:picoclaw-tester"
  "picoclaw-tester-v2:picoclaw-tester-v2"
)

if ! command -v railway >/dev/null 2>&1; then
  echo "ERROR: railway CLI is not installed."
  exit 1
fi

whoami_output="$(railway whoami 2>&1 || true)"
if [ -z "${whoami_output}" ]; then
  echo "ERROR: unable to determine railway auth state."
  exit 1
fi
if echo "${whoami_output}" | grep -qi "Failed to fetch\|dns error\|lookup address"; then
  echo "ERROR: Railway API is currently unreachable from this session."
  echo "DETAIL: ${whoami_output}" | sed -n '1,2p'
  exit 1
fi
if echo "${whoami_output}" | grep -qi "login\|not authenticated\|Unauthorized"; then
  echo "ERROR: railway CLI is not authenticated (run: railway login)."
  exit 1
fi

echo "Starting claw routing variable sync"
echo "TNF_LLM_ROUTING_API_BASE=${BASE_URL}"
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
    if railway variable set --service "${service}" \
      "TNF_LLM_ROUTING_API_BASE=${BASE_URL}" \
      "TNF_LLM_TARGET=${target}"; then
      echo "OK: ${service}"
      ok=1
      break
    fi
    sleep "${SLEEP_SECONDS}"
  done

  if [ "${ok}" -ne 1 ]; then
    echo "FAIL: ${service}"
    failed=$((failed + 1))
  fi
  echo
done

if [ "${failed}" -gt 0 ]; then
  echo "Completed with failures: ${failed} service(s)"
  exit 2
fi

echo "Completed successfully for all claw services."
