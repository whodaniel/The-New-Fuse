#!/usr/bin/env bash

set -u

BASE_URL="${TNF_LLM_ROUTING_API_BASE:-https://api-production-48f1.up.railway.app}"

targets=(
  "zeroclaw-sandbox"
  "picoclaw-perplexity"
  "picoclaw-subject"
  "picoclaw-tester"
  "picoclaw-tester-v2"
)

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required."
  exit 1
fi

echo "Verifying adaptive routing config from ${BASE_URL}"
echo

failed=0

for target in "${targets[@]}"; do
  encoded_target="$(printf '%s' "${target}" | sed 's/ /%20/g')"
  url="${BASE_URL%/}/api/agent-proxy/adaptive/config/${encoded_target}"

  echo "== ${target} =="
  response="$(curl -fsS --max-time 12 "${url}" 2>/dev/null || true)"
  if [ -z "${response}" ]; then
    echo "FAIL: no response"
    failed=$((failed + 1))
    echo
    continue
  fi

  primary_provider="$(printf '%s' "${response}" | jq -r '.primary.provider // empty' 2>/dev/null)"
  primary_model="$(printf '%s' "${response}" | jq -r '.primary.model // empty' 2>/dev/null)"
  fallback_provider="$(printf '%s' "${response}" | jq -r '.fallback.provider // empty' 2>/dev/null)"
  fallback_model="$(printf '%s' "${response}" | jq -r '.fallback.model // empty' 2>/dev/null)"

  if [ -z "${primary_provider}" ] || [ -z "${primary_model}" ] || [ -z "${fallback_provider}" ] || [ -z "${fallback_model}" ]; then
    echo "FAIL: incomplete adaptive config payload"
    echo "${response}" | jq . 2>/dev/null || echo "${response}"
    failed=$((failed + 1))
    echo
    continue
  fi

  echo "OK: primary=${primary_provider}/${primary_model} fallback=${fallback_provider}/${fallback_model}"
  echo
done

if [ "${failed}" -gt 0 ]; then
  echo "Verification failed for ${failed} target(s)"
  exit 2
fi

echo "Adaptive routing verification passed for all targets."
