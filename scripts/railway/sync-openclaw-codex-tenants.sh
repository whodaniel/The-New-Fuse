#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SYNC_ONE_SCRIPT="$ROOT_DIR/scripts/railway/sync-openclaw-codex-account.sh"
CONFIG_FILE="${OPENCLAW_CODEX_TENANTS_CONFIG:-$ROOT_DIR/scripts/railway/openclaw-codex-tenants.json}"
WAIT_FLAG=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/railway/sync-openclaw-codex-tenants.sh [--config FILE] [--no-wait]

Config format:
{
  "modelPrimary": "openai-codex/gpt-5.3-codex",
  "modelFallbacks": "openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini",
  "tenants": [
    {
      "name": "tenant-a",
      "service": "openclaw-cloud",
      "authFile": "~/.codex-tenants/tenant-a/auth.json"
    }
  ]
}
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --config)
      CONFIG_FILE="${2:-}"
      shift 2
      ;;
    --no-wait)
      WAIT_FLAG="--no-wait"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1"
    exit 1
  fi
}

need_cmd jq
need_cmd railway
need_cmd bash

if [ ! -x "$SYNC_ONE_SCRIPT" ]; then
  echo "ERROR: missing sync script: $SYNC_ONE_SCRIPT"
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config file not found: $CONFIG_FILE"
  exit 1
fi

MODEL_PRIMARY="$(jq -r '.modelPrimary // "openai-codex/gpt-5.3-codex"' "$CONFIG_FILE")"
MODEL_FALLBACKS="$(jq -r '.modelFallbacks // "openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini"' "$CONFIG_FILE")"
TENANT_COUNT="$(jq -r '.tenants | length' "$CONFIG_FILE")"

if [ "$TENANT_COUNT" -lt 1 ]; then
  echo "ERROR: config has no tenants."
  exit 1
fi

echo "Syncing $TENANT_COUNT tenant(s) with primary model: $MODEL_PRIMARY"

for idx in $(seq 0 $((TENANT_COUNT - 1))); do
  NAME="$(jq -r ".tenants[$idx].name // \"tenant-$idx\"" "$CONFIG_FILE")"
  SERVICE="$(jq -r ".tenants[$idx].service // empty" "$CONFIG_FILE")"
  AUTH_FILE_RAW="$(jq -r ".tenants[$idx].authFile // empty" "$CONFIG_FILE")"

  if [ -z "$SERVICE" ] || [ -z "$AUTH_FILE_RAW" ]; then
    echo "ERROR: tenant[$idx] missing service or authFile."
    exit 1
  fi

  AUTH_FILE="${AUTH_FILE_RAW/#\~/$HOME}"

  echo "-----"
  echo "Tenant: $NAME"
  echo "Service: $SERVICE"
  echo "Auth file: $AUTH_FILE"

  bash "$SYNC_ONE_SCRIPT" \
    --service "$SERVICE" \
    --auth-file "$AUTH_FILE" \
    --primary-model "$MODEL_PRIMARY" \
    --fallbacks "$MODEL_FALLBACKS" \
    ${WAIT_FLAG}
done

echo "All tenant sync operations completed."
