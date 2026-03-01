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
  urls=(
    "${BASE_URL%/}/api/agent-proxy/adaptive/config/${encoded_target}"
    "${BASE_URL%/}/api/api/agent-proxy/adaptive/config/${encoded_target}"
  )

  echo "== ${target} =="
  response=""
  used_url=""
  fail_detail=""
  for url in "${urls[@]}"; do
    header_file="$(mktemp)"
    body_file="$(mktemp)"
    curl_err="$(curl -sS --max-time 12 -D "${header_file}" -o "${body_file}" "${url}" 2>&1)"
    curl_exit=$?
    http_code="$(awk 'toupper($1) ~ /^HTTP\/2|^HTTP\/1\./ {c=$2} END{print c}' "${header_file}")"
    req_id="$(awk 'BEGIN{IGNORECASE=1} /^x-request-id:/ {sub(/^x-request-id:[[:space:]]*/, ""); gsub(/\r/, ""); print; exit}' "${header_file}")"
    railway_req_id="$(awk 'BEGIN{IGNORECASE=1} /^x-railway-request-id:/ {sub(/^x-railway-request-id:[[:space:]]*/, ""); gsub(/\r/, ""); print; exit}' "${header_file}")"

    if [ "${curl_exit}" -eq 0 ] && [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
      response="$(cat "${body_file}")"
      used_url="${url}"
      rm -f "${header_file}" "${body_file}"
      break
    fi

    body_snippet="$(tr '\n' ' ' < "${body_file}" | cut -c1-180)"
    err_snippet="$(printf '%s' "${curl_err}" | tr '\n' ' ' | cut -c1-180)"
    fail_detail="url=${url} curl_exit=${curl_exit} http=${http_code:-n/a} x-request-id=${req_id:-n/a} x-railway-request-id=${railway_req_id:-n/a} curl_error=${err_snippet:-n/a} body=${body_snippet:-n/a}"
    rm -f "${header_file}" "${body_file}"
  done
  if [ -z "${response}" ]; then
    echo "FAIL: no response (${urls[0]} | ${urls[1]})"
    if [ -n "${fail_detail}" ]; then
      echo "Detail: ${fail_detail}"
    fi
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
  echo "Resolved via: ${used_url}"
  echo
done

if [ "${failed}" -gt 0 ]; then
  echo "Verification failed for ${failed} target(s)"
  exit 2
fi

echo "Adaptive routing verification passed for all targets."
