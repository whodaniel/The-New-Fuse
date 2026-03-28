#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SYNC_ONE_SCRIPT="$ROOT_DIR/scripts/railway/sync-openclaw-oauth-instance.sh"
CONFIG_FILE="${OPENCLAW_OAUTH_INSTANCES_CONFIG:-$ROOT_DIR/scripts/railway/openclaw-oauth-instances.json}"
WAIT_FLAG=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/railway/sync-openclaw-oauth-instances.sh [--config FILE] [--no-wait]

Config format:
{
  "instances": [
    {
      "name": "tenant-a",
      "instanceId": "TNF-OC-001",
      "instanceName": "OpenClaw Cloud",
      "service": "openclaw-cloud",
      "provider": "openai-codex",
      "authFile": "~/.codex-tenants/tenant-a/auth.json",
      "primaryModel": "openai-codex/gpt-5.3-codex",
      "fallbackModels": "openai-codex/gpt-5.2-codex",
      "paths": {
        "access": ".tokens.access_token",
        "refresh": ".tokens.refresh_token",
        "account": ".tokens.account_id"
      }
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
need_cmd bash

if [ ! -x "$SYNC_ONE_SCRIPT" ]; then
  echo "ERROR: missing sync script: $SYNC_ONE_SCRIPT"
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config file not found: $CONFIG_FILE"
  exit 1
fi

COUNT="$(jq -r '.instances | length' "$CONFIG_FILE")"
if [ "$COUNT" -lt 1 ]; then
  echo "ERROR: config has no instances."
  exit 1
fi

echo "Syncing $COUNT OpenClaw instance(s) from config: $CONFIG_FILE"

for idx in $(seq 0 $((COUNT - 1))); do
  NAME="$(jq -r ".instances[$idx].name // \"instance-$idx\"" "$CONFIG_FILE")"
  INSTANCE_ID="$(jq -r ".instances[$idx].instanceId // empty" "$CONFIG_FILE")"
  INSTANCE_NAME="$(jq -r ".instances[$idx].instanceName // empty" "$CONFIG_FILE")"
  SERVICE="$(jq -r ".instances[$idx].service // empty" "$CONFIG_FILE")"
  PROVIDER="$(jq -r ".instances[$idx].provider // \"openai-codex\"" "$CONFIG_FILE")"
  AUTH_FILE_RAW="$(jq -r ".instances[$idx].authFile // empty" "$CONFIG_FILE")"
  PRIMARY_MODEL="$(jq -r ".instances[$idx].primaryModel // \"\"" "$CONFIG_FILE")"
  FALLBACK_MODELS="$(jq -r ".instances[$idx].fallbackModels // \"\"" "$CONFIG_FILE")"
  ACCESS_PATH="$(jq -r ".instances[$idx].paths.access // \".tokens.access_token\"" "$CONFIG_FILE")"
  REFRESH_PATH="$(jq -r ".instances[$idx].paths.refresh // \".tokens.refresh_token\"" "$CONFIG_FILE")"
  ACCOUNT_PATH="$(jq -r ".instances[$idx].paths.account // \".tokens.account_id\"" "$CONFIG_FILE")"
  GOOGLE_EMAIL_PATH="$(jq -r ".instances[$idx].paths.googleEmail // \".tokens.email\"" "$CONFIG_FILE")"
  GOOGLE_PROJECT_PATH="$(jq -r ".instances[$idx].paths.googleProject // \".tokens.project_id\"" "$CONFIG_FILE")"

  if [ -z "$INSTANCE_ID" ] || [ -z "$INSTANCE_NAME" ] || [ -z "$SERVICE" ] || [ -z "$AUTH_FILE_RAW" ] || [ -z "$PRIMARY_MODEL" ] || [ -z "$FALLBACK_MODELS" ]; then
    echo "ERROR: instance[$idx] missing one of: instanceId, instanceName, service, authFile, primaryModel, fallbackModels"
    exit 1
  fi

  AUTH_FILE="${AUTH_FILE_RAW/#\~/$HOME}"

  echo "-----"
  echo "Name: $NAME"
  echo "Instance ID: $INSTANCE_ID"
  echo "Instance Name: $INSTANCE_NAME"
  echo "Service: $SERVICE"
  echo "Provider: $PROVIDER"
  echo "Auth file: $AUTH_FILE"

  bash "$SYNC_ONE_SCRIPT" \
    --service "$SERVICE" \
    --provider "$PROVIDER" \
    --auth-file "$AUTH_FILE" \
    --instance-id "$INSTANCE_ID" \
    --instance-name "$INSTANCE_NAME" \
    --primary-model "$PRIMARY_MODEL" \
    --fallbacks "$FALLBACK_MODELS" \
    --access-path "$ACCESS_PATH" \
    --refresh-path "$REFRESH_PATH" \
    --account-path "$ACCOUNT_PATH" \
    --google-email-path "$GOOGLE_EMAIL_PATH" \
    --google-project-path "$GOOGLE_PROJECT_PATH" \
    ${WAIT_FLAG}
done

echo "All instance sync operations completed."
