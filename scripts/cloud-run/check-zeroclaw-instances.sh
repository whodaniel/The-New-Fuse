#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

# Usage:
#   scripts/cloud-run/check-zeroclaw-instances.sh
#   scripts/cloud-run/check-zeroclaw-instances.sh zeroclaw-sandbox picoclaw-tester-v2

tnf_require_gcloud
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

failures=0

echo "== ZeroClaw Cloud Run Health Check =="
echo "Project/region: $(tnf_gcp_project) / $(tnf_gcp_region)"
echo "Services: ${SERVICES[*]}"
echo

for service in "${SERVICES[@]}"; do
  echo "--- ${service} ---"

  if ! desc="$(gcloud run services describe "${service}" \
    --project="$(tnf_gcp_project)" \
    --region="$(tnf_gcp_region)" \
    --format=json 2>/dev/null)"; then
    echo "ERROR: Service not found in Cloud Run: ${service}"
    failures=$((failures + 1))
    echo
    continue
  fi

  domain="$(printf '%s' "${desc}" | jq -r '.status.url // ""' | sed 's#^https://##')"
  ready="$(printf '%s' "${desc}" | jq -r '.status.latestReadyRevisionName // ""')"
  condition="$(printf '%s' "${desc}" | jq -r '.status.conditions[0].status // "UNKNOWN"')"
  image="$(printf '%s' "${desc}" | jq -r '.spec.template.spec.containers[0].image // ""')"

  echo "ready_revision=${ready:-<none>}"
  echo "condition=${condition}"
  echo "image=${image:-<none>}"
  echo "domain=${domain:-<none>}"

  if [[ "${condition}" != "True" || -z "${ready}" ]]; then
    echo "ERROR: service is not Ready"
    failures=$((failures + 1))
  fi

  if [[ -z "${domain}" ]]; then
    echo "ERROR: no public URL configured"
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

  recent_errors="$(gcloud logging read \
    "resource.type=cloud_run_revision AND resource.labels.service_name=${service}" \
    --project="$(tnf_gcp_project)" \
    --limit=120 \
    --format='value(textPayload)' 2>/dev/null \
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
