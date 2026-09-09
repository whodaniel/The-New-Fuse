#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

SERVICE="${1:-}"
DISCORD_TOKEN="${2:-}"
DISCORD_ALLOW_FROM="${3:-}"
DISCORD_ENABLED="${4:-true}"

if [ -z "${SERVICE}" ] || [ -z "${DISCORD_TOKEN}" ]; then
  echo "Usage: $0 <cloud-run-service> <discord-bot-token> [allow_from_csv] [enabled=true|false]" >&2
  echo "Example: $0 zeroclaw-sandbox ABC123.XXX 123456789012345678,987654321098765432 true" >&2
  exit 2
fi

tnf_require_gcloud

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Setting Discord vars on Cloud Run service: ${SERVICE}"
echo "Project/region: $(tnf_gcp_project) / $(tnf_gcp_region)"

ENV_PAIRS=(
  "ZEROCLAW_CHANNELS_DISCORD_ENABLED=${DISCORD_ENABLED}"
  "PICOCLAW_CHANNELS_DISCORD_ENABLED=${DISCORD_ENABLED}"
  "ZEROCLAW_CHANNELS_DISCORD_TOKEN=${DISCORD_TOKEN}"
  "PICOCLAW_CHANNELS_DISCORD_TOKEN=${DISCORD_TOKEN}"
)
if [ -n "${DISCORD_ALLOW_FROM}" ]; then
  ENV_PAIRS+=(
    "ZEROCLAW_CHANNELS_DISCORD_ALLOW_FROM=${DISCORD_ALLOW_FROM}"
    "PICOCLAW_CHANNELS_DISCORD_ALLOW_FROM=${DISCORD_ALLOW_FROM}"
  )
fi

tnf_cloud_run_update_env "${SERVICE}" "${ENV_PAIRS[@]}"

echo "Env updated. Redeploy via scripts/deployment/gcp-deploy.sh (or gcloud run deploy) if needed."
echo "Validate with:"
echo "  gcloud run services describe ${SERVICE} --region=$(tnf_gcp_region) --format='value(status.url)'"
echo "  curl -sS \"\$(gcloud run services describe ${SERVICE} --region=$(tnf_gcp_region) --format='value(status.url)')/api/status\" | jq '.channels'"
