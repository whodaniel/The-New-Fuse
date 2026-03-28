#!/usr/bin/env bash

set -euo pipefail

SERVICE="${OPENCLAW_RAILWAY_SERVICE:-openclaw-cloud}"
PRIMARY_MODEL="${OPENCLAW_MODEL_PRIMARY_OVERRIDE:-openai-codex/gpt-5.3-codex}"
FALLBACK_MODELS="${OPENCLAW_MODEL_FALLBACKS_OVERRIDE:-openai-codex/gpt-5.2-codex}"
AUTH_FILE="${CODEX_AUTH_FILE:-$HOME/.codex/auth.json}"
INSTANCE_ID="${OPENCLAW_INSTANCE_ID:-}"
INSTANCE_NAME="${OPENCLAW_INSTANCE_NAME:-}"
MAX_SET_RETRIES="${MAX_SET_RETRIES:-20}"
MAX_STATUS_RETRIES="${MAX_STATUS_RETRIES:-90}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/railway/sync-openclaw-codex-account.sh [options]

Options:
  --service NAME          Railway service name (default: openclaw-cloud)
  --auth-file PATH        Codex auth.json path (overrides CODEX_AUTH_FILE)
  --codex-home PATH       Directory containing auth.json (sets --auth-file to PATH/auth.json)
  --instance-id ID        Required TNF instance ID (e.g. TNF-OC-004)
  --instance-name NAME    Required human-readable instance name
  --primary-model MODEL   Primary model key (default: openai-codex/gpt-5.3-codex)
  --fallbacks CSV         Fallback model list (comma-separated)
  --no-wait               Skip deployment wait loop
  -h, --help              Show this help

What it does:
  1) Reads local Codex OAuth tokens from ~/.codex/auth.json
  2) Syncs OPENAI_CODEX_* vars to Railway service
  3) Forces Codex OAuth active with gpt-5.3-codex primary model
  4) Verifies account/model vars and optionally waits for SUCCESS deploy
EOF
}

WAIT_FOR_SUCCESS=true
while [ "$#" -gt 0 ]; do
  case "$1" in
    --service)
      SERVICE="${2:-}"
      shift 2
      ;;
    --auth-file)
      AUTH_FILE="${2:-}"
      shift 2
      ;;
    --codex-home)
      AUTH_FILE="${2:-}/auth.json"
      shift 2
      ;;
    --primary-model)
      PRIMARY_MODEL="${2:-}"
      shift 2
      ;;
    --instance-id)
      INSTANCE_ID="${2:-}"
      shift 2
      ;;
    --instance-name)
      INSTANCE_NAME="${2:-}"
      shift 2
      ;;
    --fallbacks)
      FALLBACK_MODELS="${2:-}"
      shift 2
      ;;
    --no-wait)
      WAIT_FOR_SUCCESS=false
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

need_cmd railway
need_cmd jq
need_cmd curl
need_cmd rg

if [ ! -f "$AUTH_FILE" ]; then
  echo "ERROR: auth file not found: $AUTH_FILE"
  exit 1
fi

if [ -z "$INSTANCE_ID" ] || [ -z "$INSTANCE_NAME" ]; then
  echo "ERROR: --instance-id and --instance-name are required."
  exit 1
fi

RAILWAY_WHOAMI="$(railway whoami 2>&1 || true)"
if [ -z "$RAILWAY_WHOAMI" ]; then
  echo "ERROR: unable to determine Railway auth state."
  exit 1
fi
if echo "$RAILWAY_WHOAMI" | rg -qi "failed to fetch|dns error|lookup address"; then
  echo "ERROR: Railway API unreachable from this shell."
  echo "$RAILWAY_WHOAMI" | sed -n '1,2p'
  exit 1
fi
if echo "$RAILWAY_WHOAMI" | rg -qi "login|not authenticated|unauthorized"; then
  echo "ERROR: Railway CLI is not authenticated (run: railway login)."
  exit 1
fi

ACCESS_TOKEN="$(jq -r '.tokens.access_token // empty' "$AUTH_FILE")"
REFRESH_TOKEN="$(jq -r '.tokens.refresh_token // empty' "$AUTH_FILE")"
ACCOUNT_ID="$(jq -r '.tokens.account_id // empty' "$AUTH_FILE")"

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ] || [ -z "$ACCOUNT_ID" ]; then
  echo "ERROR: missing Codex OAuth fields in $AUTH_FILE"
  exit 1
fi

echo "Syncing local Codex auth -> Railway service: $SERVICE"
echo "Account: $ACCOUNT_ID"
echo "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
echo "Primary model: $PRIMARY_MODEL"
echo "Fallback models: $FALLBACK_MODELS"

set_ok=false
for attempt in $(seq 1 "$MAX_SET_RETRIES"); do
  if railway variables set \
      "OPENAI_CODEX_ACCESS_TOKEN=$ACCESS_TOKEN" \
      "OPENAI_CODEX_REFRESH_TOKEN=$REFRESH_TOKEN" \
      "OPENAI_CODEX_ACCOUNT_ID=$ACCOUNT_ID" \
      "OPENCLAW_USE_CODEX_OAUTH=true" \
      "OPENCLAW_INSTANCE_ID=$INSTANCE_ID" \
      "OPENCLAW_INSTANCE_NAME=$INSTANCE_NAME" \
      "OPENCLAW_UI_ASSISTANT_NAME=$INSTANCE_NAME" \
      "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL" \
      "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL" \
      "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS" \
      --service "$SERVICE" >/tmp/openclaw_sync_set.out 2>/tmp/openclaw_sync_set.err; then
    set_ok=true
    echo "Set vars: success (attempt $attempt)"
    break
  fi
  echo "Set vars: retry $attempt/$MAX_SET_RETRIES"
  sleep "$SLEEP_SECONDS"
done

if [ "$set_ok" = false ]; then
  echo "ERROR: failed to set Railway vars."
  sed -n '1,40p' /tmp/openclaw_sync_set.err || true
  exit 2
fi

VAR_JSON="$(railway variable list --service "$SERVICE" --json)"
REMOTE_ACCOUNT_ID="$(printf '%s' "$VAR_JSON" | jq -r '.OPENAI_CODEX_ACCOUNT_ID // empty')"
REMOTE_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_PRIMARY // empty')"
REMOTE_USE_CODEX="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_USE_CODEX_OAUTH // empty')"
REMOTE_AGENT_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY // empty')"
REMOTE_FALLBACKS="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_FALLBACKS // empty')"
PUBLIC_DOMAIN="$(printf '%s' "$VAR_JSON" | jq -r '.RAILWAY_PUBLIC_DOMAIN // empty')"

echo "Verification:"
echo "  OPENAI_CODEX_ACCOUNT_ID=$REMOTE_ACCOUNT_ID"
echo "  OPENCLAW_MODEL_PRIMARY=$REMOTE_PRIMARY"
echo "  OPENCLAW_USE_CODEX_OAUTH=$REMOTE_USE_CODEX"
echo "  OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$REMOTE_AGENT_PRIMARY"
echo "  OPENCLAW_MODEL_FALLBACKS=$REMOTE_FALLBACKS"

if [ "$REMOTE_ACCOUNT_ID" != "$ACCOUNT_ID" ] || \
   [ "$REMOTE_PRIMARY" != "$PRIMARY_MODEL" ] || \
   [ "$REMOTE_AGENT_PRIMARY" != "$PRIMARY_MODEL" ] || \
   [ "$REMOTE_USE_CODEX" != "true" ]; then
  echo "ERROR: post-sync verification failed."
  exit 3
fi

if [ "$WAIT_FOR_SUCCESS" = true ]; then
  echo "Waiting for latest deployment on $SERVICE to reach SUCCESS..."
  for attempt in $(seq 1 "$MAX_STATUS_RETRIES"); do
    STATUS="$(railway status --json | jq -r '.environments.edges[].node.serviceInstances.edges[].node | select(.serviceName=="'"$SERVICE"'") | .latestDeployment.status' | head -n1)"
    CREATED_AT="$(railway status --json | jq -r '.environments.edges[].node.serviceInstances.edges[].node | select(.serviceName=="'"$SERVICE"'") | .latestDeployment.createdAt' | head -n1)"
    DEPLOY_ID="$(railway status --json | jq -r '.environments.edges[].node.serviceInstances.edges[].node | select(.serviceName=="'"$SERVICE"'") | .latestDeployment.id' | head -n1)"
    echo "  attempt=$attempt status=$STATUS deployId=$DEPLOY_ID createdAt=$CREATED_AT"
    if [ "$STATUS" = "SUCCESS" ]; then
      break
    fi
    sleep "$SLEEP_SECONDS"
    if [ "$attempt" -eq "$MAX_STATUS_RETRIES" ]; then
      echo "ERROR: deployment did not reach SUCCESS in time."
      exit 4
    fi
  done
fi

if [ -n "$PUBLIC_DOMAIN" ]; then
  skip_overview="${OPENCLAW_SKIP_OVERVIEW_CHECK:-false}"
  if [[ "$PUBLIC_DOMAIN" == *"openclaw-sandbox-cloud"* ]]; then
    skip_overview=true
  fi

  if [ "$skip_overview" != "true" ]; then
    OVERVIEW_URL="https://${PUBLIC_DOMAIN}/overview"
    for attempt in $(seq 1 15); do
      code="$(curl -sS -o /dev/null -w "%{http_code}" "$OVERVIEW_URL" || true)"
      echo "Overview check attempt=$attempt status=$code"
      if [ "$code" = "200" ]; then
        echo "Done: $OVERVIEW_URL is healthy."
        exit 0
      fi
      sleep 2
    done
  fi

  HEALTH_URL="https://${PUBLIC_DOMAIN}/health"
  for attempt in $(seq 1 15); do
    code="$(curl -sS -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)"
    echo "Health check attempt=$attempt status=$code"
    if [ "$code" = "200" ]; then
      echo "Done: $HEALTH_URL is healthy."
      exit 0
    fi
    sleep 2
  done
  echo "WARN: overview and health endpoints did not return 200 yet."
  exit 5
fi

echo "Done: sync complete (public domain not found in vars; skipped overview check)."
