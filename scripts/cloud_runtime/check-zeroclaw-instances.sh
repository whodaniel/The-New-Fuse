#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/cloud_runtime/check-zeroclaw-instances.sh
#   scripts/cloud_runtime/check-zeroclaw-instances.sh zeroclaw-sandbox picoclaw-tester-v2

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "ERROR: cloud_runtime CLI not found in PATH" >&2
  exit 2
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found in PATH" >&2
  exit 2
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl not found in PATH" >&2
  exit 2
fi

declare -a SERVICES
if [[ $# -gt 0 ]]; then
  SERVICES=("$@")
else
  SERVICES=("zeroclaw-sandbox" "picoclaw-tester-v2")
fi

STATUS_JSON="$(cloud_runtime status --json)"
failures=0

echo "== ZeroClaw CloudRuntime Health Check =="
echo "Services: ${SERVICES[*]}"
echo

for service in "${SERVICES[@]}"; do
  echo "--- ${service} ---"

  service_json="$(printf '%s' "${STATUS_JSON}" | jq -c --arg s "${service}" '
    .environments.edges[].node.serviceInstances.edges[].node
    | select(.serviceName==$s)
  ')"

  if [[ -z "${service_json}" ]]; then
    echo "ERROR: Service not found in current CloudRuntime context: ${service}"
    failures=$((failures + 1))
    echo
    continue
  fi

  domain="$(printf '%s' "${service_json}" | jq -r '.domains.serviceDomains[0].domain // ""')"
  deploy_id="$(printf '%s' "${service_json}" | jq -r '.latestDeployment.id // ""')"
  deploy_status="$(printf '%s' "${service_json}" | jq -r '.latestDeployment.status // "UNKNOWN"')"
  source_image="$(printf '%s' "${service_json}" | jq -r '.source.image // ""')"

  echo "deploy_id=${deploy_id}"
  echo "deploy_status=${deploy_status}"
  echo "source_image=${source_image:-<none>}"
  echo "domain=${domain:-<none>}"

  if [[ "${deploy_status}" != "SUCCESS" ]]; then
    echo "ERROR: latest deployment is not SUCCESS"
    failures=$((failures + 1))
  fi

  if [[ -z "${domain}" ]]; then
    echo "ERROR: no public domain configured"
    failures=$((failures + 1))
    echo
    continue
  fi

  health_body="$(curl -fsS --max-time 12 "https://${domain}/health" 2>/dev/null || true)"
  if [[ -z "${health_body}" ]]; then
    echo "ERROR: /health not reachable"
    failures=$((failures + 1))
  else
    health_status="$(printf '%s' "${health_body}" | jq -r '.status // .ok // empty' 2>/dev/null || true)"
    echo "health_status=${health_status:-<unparsed>}"
    if [[ -z "${health_status}" ]]; then
      echo "ERROR: /health response not parseable as expected JSON"
      failures=$((failures + 1))
    fi
  fi

  status_body="$(curl -fsS --max-time 12 "https://${domain}/api/status" 2>/dev/null || true)"
  if [[ -n "${status_body}" ]]; then
    telegram_state="$(printf '%s' "${status_body}" | jq -r '.channels.Telegram // empty' 2>/dev/null || true)"
    provider="$(printf '%s' "${status_body}" | jq -r '.provider // empty' 2>/dev/null || true)"
    model="$(printf '%s' "${status_body}" | jq -r '.model // empty' 2>/dev/null || true)"
    if [[ -n "${telegram_state}" ]]; then
      echo "telegram=${telegram_state} provider=${provider:-<none>} model=${model:-<none>}"
    else
      echo "WARN: /api/status reachable but shape differs from ZeroClaw status"
    fi
  else
    echo "WARN: /api/status not reachable"
  fi

  recent_errors="$(cloud_runtime logs --service "${service}" --deployment --latest --lines 120 2>/dev/null \
    | rg -i "All providers/models failed|No response from OpenAI Codex websocket stream|Missing Authentication header|Custom API key not set|Application failed to respond|panic|ERROR" || true)"
  if [[ -n "${recent_errors}" ]]; then
    echo "WARN: matching error signatures found in recent logs"
    echo "${recent_errors}" | sed -n '1,8p'
  else
    echo "recent_error_scan=clean"
  fi

  echo
done

if [[ ${failures} -gt 0 ]]; then
  echo "FAILED: ${failures} blocking issue(s) detected."
  exit 1
fi

echo "PASS: all blocking checks passed."
