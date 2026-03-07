#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SYNC_ONE_SCRIPT="$ROOT_DIR/scripts/railway/sync-openclaw-codex-account.sh"
CONFIG_FILE="${OPENCLAW_CODEX_TENANTS_CONFIG:-$ROOT_DIR/scripts/railway/openclaw-codex-tenants.json}"
WAIT_FLAG=""
RAILWAY_VAR_LIST_MAX_RETRIES="${RAILWAY_VAR_LIST_MAX_RETRIES:-8}"
RAILWAY_VAR_LIST_SLEEP_SECONDS="${RAILWAY_VAR_LIST_SLEEP_SECONDS:-3}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/railway/sync-openclaw-codex-tenants.sh [--config FILE] [--no-wait]

Config format:
{
  "modelPrimary": "openai-codex/gpt-5.3-codex",
  "modelFallbacks": "openai-codex/gpt-5.2-codex,openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini",
  "tenants": [
    {
      "name": "tenant-a",
      "instanceId": "TNF-OC-001",
      "instanceName": "OpenClaw Cloud",
      "service": "openclaw-cloud",
      "authFile": "~/.codex-tenants/tenant-a/auth.json",
      "targetAccountId": "uuid-here",
      "mode": "locked"
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
need_cmd mktemp

if [ ! -x "$SYNC_ONE_SCRIPT" ]; then
  echo "ERROR: missing sync script: $SYNC_ONE_SCRIPT"
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config file not found: $CONFIG_FILE"
  exit 1
fi

MODEL_PRIMARY="$(jq -r '.modelPrimary // "openai-codex/gpt-5.3-codex"' "$CONFIG_FILE")"
MODEL_FALLBACKS="$(jq -r '.modelFallbacks // "openai-codex/gpt-5.2-codex,openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini"' "$CONFIG_FILE")"
TENANT_COUNT="$(jq -r '.tenants | length' "$CONFIG_FILE")"

if [ "$TENANT_COUNT" -lt 1 ]; then
  echo "ERROR: config has no tenants."
  exit 1
fi

echo "Syncing $TENANT_COUNT tenant(s) with primary model: $MODEL_PRIMARY"

railway_var_list_json() {
  local service="$1"
  local __json_var="$2"
  local __err_var="$3"
  local attempt
  local out
  local err_file
  err_file="$(mktemp)"
  out=""

  for attempt in $(seq 1 "$RAILWAY_VAR_LIST_MAX_RETRIES"); do
    if out="$(railway variable list --service "$service" --json 2>"$err_file")"; then
      if printf '%s' "$out" | jq -e 'type == "object"' >/dev/null 2>&1; then
        printf -v "$__json_var" '%s' "$out"
        printf -v "$__err_var" ''
        rm -f "$err_file"
        return 0
      fi
    fi

    if [ "$attempt" -lt "$RAILWAY_VAR_LIST_MAX_RETRIES" ]; then
      echo "WARN: railway variable list failed for $service (attempt $attempt/$RAILWAY_VAR_LIST_MAX_RETRIES); retrying..."
      sleep "$RAILWAY_VAR_LIST_SLEEP_SECONDS"
    fi
  done

  printf -v "$__json_var" '%s' "$out"
  printf -v "$__err_var" '%s' "$(cat "$err_file" 2>/dev/null || true)"
  rm -f "$err_file"
  return 1
}

for idx in $(seq 0 $((TENANT_COUNT - 1))); do
  NAME="$(jq -r ".tenants[$idx].name // \"tenant-$idx\"" "$CONFIG_FILE")"
  INSTANCE_ID="$(jq -r ".tenants[$idx].instanceId // empty" "$CONFIG_FILE")"
  INSTANCE_NAME="$(jq -r ".tenants[$idx].instanceName // empty" "$CONFIG_FILE")"
  SERVICE="$(jq -r ".tenants[$idx].service // empty" "$CONFIG_FILE")"
  AUTH_FILE_RAW="$(jq -r ".tenants[$idx].authFile // empty" "$CONFIG_FILE")"
  TARGET_ACCOUNT_ID="$(jq -r ".tenants[$idx].targetAccountId // empty" "$CONFIG_FILE")"
  MODE="$(jq -r ".tenants[$idx].mode // \"locked\"" "$CONFIG_FILE")"

  if [ "$MODE" != "locked" ] && [ "$MODE" != "rotate" ] && [ "$MODE" != "pending" ]; then
    echo "ERROR: tenant[$idx] mode must be 'locked', 'rotate', or 'pending'."
    exit 1
  fi

  if [ "$MODE" = "pending" ]; then
    echo "-----"
    echo "Tenant: $NAME"
    echo "Mode: pending (skipped)"
    echo "Reason: waiting for auth file/service assignment."
    continue
  fi

  if [ -z "$INSTANCE_ID" ] || [ -z "$INSTANCE_NAME" ] || [ -z "$SERVICE" ] || [ -z "$AUTH_FILE_RAW" ]; then
    echo "ERROR: tenant[$idx] missing instanceId, instanceName, service, or authFile."
    exit 1
  fi

  AUTH_FILE="${AUTH_FILE_RAW/#\~/$HOME}"

  echo "-----"
  echo "Tenant: $NAME"
  echo "Instance ID: $INSTANCE_ID"
  echo "Instance Name: $INSTANCE_NAME"
  echo "Service: $SERVICE"
  echo "Auth file: $AUTH_FILE"
  echo "Mode: $MODE"

  TARGET_FROM_FILE="$(jq -r '.tokens.account_id // empty' "$AUTH_FILE" 2>/dev/null || true)"
  if [ -z "$TARGET_FROM_FILE" ]; then
    echo "ERROR: auth file missing .tokens.account_id -> $AUTH_FILE"
    exit 1
  fi
  if [ -n "$TARGET_ACCOUNT_ID" ] && [ "$TARGET_ACCOUNT_ID" != "$TARGET_FROM_FILE" ]; then
    echo "ERROR: targetAccountId mismatch for $NAME"
    echo "  config targetAccountId: $TARGET_ACCOUNT_ID"
    echo "  auth file account_id:   $TARGET_FROM_FILE"
    exit 1
  fi

  REMOTE_FETCH_OK=false
  VAR_JSON=""
  VAR_ERR=""
  if railway_var_list_json "$SERVICE" VAR_JSON VAR_ERR; then
    REMOTE_FETCH_OK=true
  fi

  REMOTE_ACCOUNT_ID="$(printf '%s' "$VAR_JSON" | jq -r '.OPENAI_CODEX_ACCOUNT_ID // empty' 2>/dev/null || true)"
  REMOTE_PRIMARY_MODEL="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_PRIMARY // empty' 2>/dev/null || true)"
  echo "Current remote account: ${REMOTE_ACCOUNT_ID:-<missing>}"
  echo "Target account: $TARGET_FROM_FILE"
  echo "Current remote model: ${REMOTE_PRIMARY_MODEL:-<missing>}"
  echo "Target model: $MODEL_PRIMARY"

  if [ "$MODE" = "rotate" ] && [ -z "$TARGET_ACCOUNT_ID" ]; then
    echo "ERROR: rotate mode requires explicit targetAccountId for $SERVICE."
    exit 1
  fi
  if [ "$MODE" = "locked" ] && [ "$REMOTE_FETCH_OK" != "true" ]; then
    echo "ERROR: locked mode could not verify remote account for $SERVICE (fail-closed)."
    if [ -n "$VAR_ERR" ]; then
      printf '%s\n' "$VAR_ERR" | sed -n '1,20p'
    fi
    exit 1
  fi
  if [ "$MODE" = "locked" ] && [ -n "$REMOTE_ACCOUNT_ID" ] && [ "$REMOTE_ACCOUNT_ID" != "$TARGET_FROM_FILE" ]; then
    echo "ERROR: locked mode prevents account reassignment for $SERVICE."
    echo "Set tenant mode to 'rotate' to intentionally switch account bindings."
    exit 1
  fi

  bash "$SYNC_ONE_SCRIPT" \
    --service "$SERVICE" \
    --auth-file "$AUTH_FILE" \
    --instance-id "$INSTANCE_ID" \
    --instance-name "$INSTANCE_NAME" \
    --primary-model "$MODEL_PRIMARY" \
    --fallbacks "$MODEL_FALLBACKS" \
    ${WAIT_FLAG}
done

echo "All tenant sync operations completed."
