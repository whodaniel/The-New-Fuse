#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "cloud_runtime CLI not found. Install: npm i -g @cloud_runtime/cli" >&2
  exit 1
fi

SERVICE="${1:-}"
DISCORD_TOKEN="${2:-}"
DISCORD_ALLOW_FROM="${3:-}"
DISCORD_ENABLED="${4:-true}"

if [ -z "${SERVICE}" ] || [ -z "${DISCORD_TOKEN}" ]; then
  echo "Usage: $0 <cloud_runtime-service> <discord-bot-token> [allow_from_csv] [enabled=true|false]" >&2
  echo "Example: $0 zeroclaw-sandbox ABC123.XXX 123456789012345678,987654321098765432 true" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Setting Discord vars on service: ${SERVICE}"
cloud_runtime service "${SERVICE}" >/dev/null

cloud_runtime variables --set \
  "ZEROCLAW_CHANNELS_DISCORD_ENABLED=${DISCORD_ENABLED}" \
  "PICOCLAW_CHANNELS_DISCORD_ENABLED=${DISCORD_ENABLED}" \
  "ZEROCLAW_CHANNELS_DISCORD_TOKEN=${DISCORD_TOKEN}" \
  "PICOCLAW_CHANNELS_DISCORD_TOKEN=${DISCORD_TOKEN}" >/dev/null

if [ -n "${DISCORD_ALLOW_FROM}" ]; then
  cloud_runtime variables --set \
    "ZEROCLAW_CHANNELS_DISCORD_ALLOW_FROM=${DISCORD_ALLOW_FROM}" \
    "PICOCLAW_CHANNELS_DISCORD_ALLOW_FROM=${DISCORD_ALLOW_FROM}" >/dev/null
fi

echo "Deploying ${SERVICE} from apps/zeroclaw-sandbox"
(
  cd "${ROOT_DIR}"
  cloud_runtime up apps/zeroclaw-sandbox --path-as-root --ci --service "${SERVICE}"
)

echo "Done. Validate with:"
echo "curl -sS https://${SERVICE}-production.thenewfuse.com/api/status | jq '.channels'"
