#!/usr/bin/env bash

set -euo pipefail

SERVICE="${OPENCLAW_RAILWAY_SERVICE:-openclaw-cloud}"
PROVIDER="${OPENCLAW_OAUTH_PROVIDER:-openai-codex}"
AUTH_FILE="${OPENCLAW_OAUTH_AUTH_FILE:-$HOME/.codex/auth.json}"
PRIMARY_MODEL="${OPENCLAW_MODEL_PRIMARY_OVERRIDE:-openai-codex/gpt-5.3-codex}"
FALLBACK_MODELS="${OPENCLAW_MODEL_FALLBACKS_OVERRIDE:-openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini}"
MAX_SET_RETRIES="${MAX_SET_RETRIES:-20}"
MAX_STATUS_RETRIES="${MAX_STATUS_RETRIES:-90}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

ACCESS_PATH="${OPENCLAW_AUTH_ACCESS_PATH:-.tokens.access_token}"
REFRESH_PATH="${OPENCLAW_AUTH_REFRESH_PATH:-.tokens.refresh_token}"
ACCOUNT_PATH="${OPENCLAW_AUTH_ACCOUNT_PATH:-.tokens.account_id}"
GOOGLE_EMAIL_PATH="${OPENCLAW_AUTH_GOOGLE_EMAIL_PATH:-.tokens.email}"
GOOGLE_PROJECT_PATH="${OPENCLAW_AUTH_GOOGLE_PROJECT_PATH:-.tokens.project_id}"

WAIT_FOR_SUCCESS=true

usage() {
  cat <<'EOF'
Usage:
  bash scripts/railway/sync-openclaw-oauth-instance.sh [options]

Options:
  --service NAME          Railway service name
  --provider NAME         openai-codex | anthropic | google-antigravity | kilo
  --auth-file PATH        OAuth token json file
  --codex-home PATH       Shorthand for --auth-file PATH/auth.json
  --primary-model MODEL   OPENCLAW_MODEL_PRIMARY value
  --fallbacks CSV         OPENCLAW_MODEL_FALLBACKS value
  --access-path JQ        JQ path in auth file for access token
  --refresh-path JQ       JQ path in auth file for refresh token
  --account-path JQ       JQ path in auth file for account id
  --google-email-path JQ  JQ path in auth file for Google email
  --google-project-path JQ JQ path in auth file for Google project ID
  --no-wait               Skip deployment wait loop
  -h, --help              Show help
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --service)
      SERVICE="${2:-}"
      shift 2
      ;;
    --provider)
      PROVIDER="${2:-}"
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
    --fallbacks)
      FALLBACK_MODELS="${2:-}"
      shift 2
      ;;
    --access-path)
      ACCESS_PATH="${2:-}"
      shift 2
      ;;
    --refresh-path)
      REFRESH_PATH="${2:-}"
      shift 2
      ;;
    --account-path)
      ACCOUNT_PATH="${2:-}"
      shift 2
      ;;
    --google-email-path)
      GOOGLE_EMAIL_PATH="${2:-}"
      shift 2
      ;;
    --google-project-path)
      GOOGLE_PROJECT_PATH="${2:-}"
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

ACCESS_TOKEN="$(jq -r "${ACCESS_PATH} // empty" "$AUTH_FILE")"
REFRESH_TOKEN="$(jq -r "${REFRESH_PATH} // empty" "$AUTH_FILE")"
ACCOUNT_ID="$(jq -r "${ACCOUNT_PATH} // empty" "$AUTH_FILE")"
GOOGLE_EMAIL="$(jq -r "${GOOGLE_EMAIL_PATH} // empty" "$AUTH_FILE")"
GOOGLE_PROJECT_ID="$(jq -r "${GOOGLE_PROJECT_PATH} // empty" "$AUTH_FILE")"

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
  echo "ERROR: missing access/refresh token in $AUTH_FILE"
  echo "Checked access path: ${ACCESS_PATH}"
  echo "Checked refresh path: ${REFRESH_PATH}"
  exit 1
fi

echo "Syncing provider auth -> Railway service: $SERVICE"
echo "Provider: $PROVIDER"
echo "Primary model: $PRIMARY_MODEL"
echo "Fallback models: $FALLBACK_MODELS"
if [ "$PROVIDER" = "openai-codex" ]; then
  echo "Account: ${ACCOUNT_ID:-<missing>}"
fi

set_ok=false
for attempt in $(seq 1 "$MAX_SET_RETRIES"); do
  case "$PROVIDER" in
    openai-codex)
      if [ -z "$ACCOUNT_ID" ]; then
        echo "ERROR: missing account id path for openai-codex provider: $ACCOUNT_PATH"
        exit 1
      fi
      if railway variables set \
        "OPENAI_CODEX_ACCESS_TOKEN=$ACCESS_TOKEN" \
        "OPENAI_CODEX_REFRESH_TOKEN=$REFRESH_TOKEN" \
        "OPENAI_CODEX_ACCOUNT_ID=$ACCOUNT_ID" \
        "OPENCLAW_USE_CODEX_OAUTH=true" \
        "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS" \
        --service "$SERVICE" >/tmp/openclaw_oauth_set.out 2>/tmp/openclaw_oauth_set.err; then
        set_ok=true
      fi
      ;;
    anthropic)
      if railway variables set \
        "ANTHROPIC_OAUTH_ACCESS_TOKEN=$ACCESS_TOKEN" \
        "ANTHROPIC_OAUTH_REFRESH_TOKEN=$REFRESH_TOKEN" \
        "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS" \
        --service "$SERVICE" >/tmp/openclaw_oauth_set.out 2>/tmp/openclaw_oauth_set.err; then
        set_ok=true
      fi
      ;;
    google-antigravity)
      if railway variables set \
        "GOOGLE_ANTIGRAVITY_ACCESS_TOKEN=$ACCESS_TOKEN" \
        "GOOGLE_ANTIGRAVITY_REFRESH_TOKEN=$REFRESH_TOKEN" \
        "GOOGLE_ANTIGRAVITY_EMAIL=$GOOGLE_EMAIL" \
        "GOOGLE_ANTIGRAVITY_PROJECT_ID=$GOOGLE_PROJECT_ID" \
        "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS" \
        --service "$SERVICE" >/tmp/openclaw_oauth_set.out 2>/tmp/openclaw_oauth_set.err; then
        set_ok=true
      fi
      ;;
    kilo)
      if railway variables set \
        "KILO_ACCESS_TOKEN=$ACCESS_TOKEN" \
        "KILO_REFRESH_TOKEN=$REFRESH_TOKEN" \
        "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL" \
        "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS" \
        --service "$SERVICE" >/tmp/openclaw_oauth_set.out 2>/tmp/openclaw_oauth_set.err; then
        set_ok=true
      fi
      ;;
    *)
      echo "ERROR: unsupported provider: $PROVIDER"
      echo "Supported: openai-codex, anthropic, google-antigravity, kilo"
      exit 1
      ;;
  esac

  if [ "$set_ok" = true ]; then
    echo "Set vars: success (attempt $attempt)"
    break
  fi
  echo "Set vars: retry $attempt/$MAX_SET_RETRIES"
  sleep "$SLEEP_SECONDS"
done

if [ "$set_ok" = false ]; then
  echo "ERROR: failed to set Railway vars."
  sed -n '1,40p' /tmp/openclaw_oauth_set.err || true
  exit 2
fi

VAR_JSON="$(railway variable list --service "$SERVICE" --json)"
REMOTE_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_PRIMARY // empty')"
REMOTE_USE_CODEX="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_USE_CODEX_OAUTH // empty')"
REMOTE_FALLBACKS="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_FALLBACKS // empty')"
REMOTE_AGENT_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY // empty')"
PUBLIC_DOMAIN="$(printf '%s' "$VAR_JSON" | jq -r '.RAILWAY_PUBLIC_DOMAIN // empty')"

echo "Verification:"
echo "  OPENCLAW_MODEL_PRIMARY=$REMOTE_PRIMARY"
echo "  OPENCLAW_USE_CODEX_OAUTH=$REMOTE_USE_CODEX"
echo "  OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$REMOTE_AGENT_PRIMARY"
echo "  OPENCLAW_MODEL_FALLBACKS=$REMOTE_FALLBACKS"

if [ "$PROVIDER" = "openai-codex" ]; then
  REMOTE_ACCOUNT_ID="$(printf '%s' "$VAR_JSON" | jq -r '.OPENAI_CODEX_ACCOUNT_ID // empty')"
  echo "  OPENAI_CODEX_ACCOUNT_ID=$REMOTE_ACCOUNT_ID"
  if [ "$REMOTE_ACCOUNT_ID" != "$ACCOUNT_ID" ]; then
    echo "ERROR: OPENAI_CODEX_ACCOUNT_ID mismatch after sync."
    exit 3
  fi
fi

if [ "$REMOTE_PRIMARY" != "$PRIMARY_MODEL" ] || \
  [ "$REMOTE_AGENT_PRIMARY" != "$PRIMARY_MODEL" ]; then
  echo "ERROR: model primary verification failed."
  exit 3
fi

if [ "$PROVIDER" = "openai-codex" ] && [ "$REMOTE_USE_CODEX" != "true" ]; then
  echo "ERROR: OPENCLAW_USE_CODEX_OAUTH not true after openai-codex sync."
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
  OVERVIEW_URL="https://${PUBLIC_DOMAIN}/overview"
  for attempt in $(seq 1 20); do
    code="$(curl -sS -o /dev/null -w "%{http_code}" "$OVERVIEW_URL" || true)"
    echo "Overview check attempt=$attempt status=$code"
    if [ "$code" = "200" ]; then
      echo "Done: $OVERVIEW_URL is healthy."
      exit 0
    fi
    sleep 2
  done
  echo "WARN: overview endpoint did not return 200 yet."
  exit 5
fi

echo "Done: sync complete (public domain not found in vars; skipped overview check)."
