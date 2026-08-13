#!/usr/bin/env bash

set -euo pipefail

SERVICE="${OPENCLAW_CLOUD_RUNTIME_SERVICE:-openclaw-cloud}"
PROVIDER="${OPENCLAW_OAUTH_PROVIDER:-openai-codex}"
AUTH_FILE="${OPENCLAW_OAUTH_AUTH_FILE:-$HOME/.codex/auth.json}"
PRIMARY_MODEL="${OPENCLAW_MODEL_PRIMARY_OVERRIDE:-openai-codex/gpt-5.3-codex}"
FALLBACK_MODELS="${OPENCLAW_MODEL_FALLBACKS_OVERRIDE:-openai-codex/gpt-5.2-codex}"
INSTANCE_ID="${OPENCLAW_INSTANCE_ID:-}"
INSTANCE_NAME="${OPENCLAW_INSTANCE_NAME:-}"
MAX_SET_RETRIES="${MAX_SET_RETRIES:-20}"
MAX_STATUS_RETRIES="${MAX_STATUS_RETRIES:-90}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

ACCESS_PATH="${OPENCLAW_AUTH_ACCESS_PATH:-.tokens.access_token}"
REFRESH_PATH="${OPENCLAW_AUTH_REFRESH_PATH:-.tokens.refresh_token}"
ACCOUNT_PATH="${OPENCLAW_AUTH_ACCOUNT_PATH:-.tokens.account_id}"
GOOGLE_EMAIL_PATH="${OPENCLAW_AUTH_GOOGLE_EMAIL_PATH:-.tokens.email}"
GOOGLE_PROJECT_PATH="${OPENCLAW_AUTH_GOOGLE_PROJECT_PATH:-.tokens.project_id}"

WAIT_FOR_SUCCESS=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/cloud_runtime/sync-openclaw-oauth-instance.sh [options]

Options:
  --service NAME          Cloud Run service name
  --provider NAME         openai-codex | anthropic | google-antigravity | kilo
  --auth-file PATH        OAuth token json file
  --codex-home PATH       Shorthand for --auth-file PATH/auth.json
  --instance-id ID        Required TNF instance ID (e.g. TNF-OC-004)
  --instance-name NAME    Required human-readable instance name
  --primary-model MODEL   OPENCLAW_MODEL_PRIMARY value
  --fallbacks CSV         OPENCLAW_MODEL_FALLBACKS value
  --access-path JQ        JQ path in auth file for access token
  --refresh-path JQ       JQ path in auth file for refresh token
  --account-path JQ       JQ path in auth file for account id
  --google-email-path JQ  JQ path in auth file for Google email
  --google-project-path JQ JQ path in auth file for Google project ID
  --no-wait               Skip deployment wait loop
  -h, --help              Show help

Notes:
  Uses gcloud (Cloud Run). The legacy cloud_runtime/railway CLI does not exist.
  Env: TNF_GCP_PROJECT_ID / TNF_GCP_REGION (defaults: the-new-fuse-2025 / us-central1).
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

need_cmd jq
need_cmd curl
need_cmd rg
tnf_require_gcloud

if [ ! -f "$AUTH_FILE" ]; then
  echo "ERROR: auth file not found: $AUTH_FILE"
  exit 1
fi

if [ -z "$INSTANCE_ID" ] || [ -z "$INSTANCE_NAME" ]; then
  echo "ERROR: --instance-id and --instance-name are required."
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

echo "Syncing provider auth -> Cloud Run service: $SERVICE"
echo "Project/region: $(tnf_gcp_project) / $(tnf_gcp_region)"
echo "Provider: $PROVIDER"
echo "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
echo "Primary model: $PRIMARY_MODEL"
echo "Fallback models: $FALLBACK_MODELS"
if [ "$PROVIDER" = "openai-codex" ]; then
  echo "Account: ${ACCOUNT_ID:-<missing>}"
fi

ENV_PAIRS=()
case "$PROVIDER" in
  openai-codex)
    if [ -z "$ACCOUNT_ID" ]; then
      echo "ERROR: missing account id path for openai-codex provider: $ACCOUNT_PATH"
      exit 1
    fi
    ENV_PAIRS=(
      "OPENAI_CODEX_ACCESS_TOKEN=$ACCESS_TOKEN"
      "OPENAI_CODEX_REFRESH_TOKEN=$REFRESH_TOKEN"
      "OPENAI_CODEX_ACCOUNT_ID=$ACCOUNT_ID"
      "OPENCLAW_USE_CODEX_OAUTH=true"
      "OPENCLAW_INSTANCE_ID=$INSTANCE_ID"
      "OPENCLAW_INSTANCE_NAME=$INSTANCE_NAME"
      "OPENCLAW_UI_ASSISTANT_NAME=$INSTANCE_NAME"
      "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS"
    )
    ;;
  anthropic)
    ENV_PAIRS=(
      "ANTHROPIC_OAUTH_ACCESS_TOKEN=$ACCESS_TOKEN"
      "ANTHROPIC_OAUTH_REFRESH_TOKEN=$REFRESH_TOKEN"
      "OPENCLAW_INSTANCE_ID=$INSTANCE_ID"
      "OPENCLAW_INSTANCE_NAME=$INSTANCE_NAME"
      "OPENCLAW_UI_ASSISTANT_NAME=$INSTANCE_NAME"
      "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS"
    )
    ;;
  google-antigravity)
    ENV_PAIRS=(
      "GOOGLE_ANTIGRAVITY_ACCESS_TOKEN=$ACCESS_TOKEN"
      "GOOGLE_ANTIGRAVITY_REFRESH_TOKEN=$REFRESH_TOKEN"
      "GOOGLE_ANTIGRAVITY_EMAIL=$GOOGLE_EMAIL"
      "GOOGLE_ANTIGRAVITY_PROJECT_ID=$GOOGLE_PROJECT_ID"
      "OPENCLAW_INSTANCE_ID=$INSTANCE_ID"
      "OPENCLAW_INSTANCE_NAME=$INSTANCE_NAME"
      "OPENCLAW_UI_ASSISTANT_NAME=$INSTANCE_NAME"
      "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS"
    )
    ;;
  kilo)
    ENV_PAIRS=(
      "KILO_ACCESS_TOKEN=$ACCESS_TOKEN"
      "KILO_REFRESH_TOKEN=$REFRESH_TOKEN"
      "OPENCLAW_INSTANCE_ID=$INSTANCE_ID"
      "OPENCLAW_INSTANCE_NAME=$INSTANCE_NAME"
      "OPENCLAW_UI_ASSISTANT_NAME=$INSTANCE_NAME"
      "OPENCLAW_MODEL_PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=$PRIMARY_MODEL"
      "OPENCLAW_MODEL_FALLBACKS=$FALLBACK_MODELS"
    )
    ;;
  *)
    echo "ERROR: unsupported provider: $PROVIDER"
    echo "Supported: openai-codex, anthropic, google-antigravity, kilo"
    exit 1
    ;;
esac

set_ok=false
for attempt in $(seq 1 "$MAX_SET_RETRIES"); do
  if tnf_cloud_run_update_env "$SERVICE" "${ENV_PAIRS[@]}" >/tmp/openclaw_oauth_set.out 2>/tmp/openclaw_oauth_set.err; then
    set_ok=true
    echo "Set vars: success (attempt $attempt)"
    break
  fi
  echo "Set vars: retry $attempt/$MAX_SET_RETRIES"
  sleep "$SLEEP_SECONDS"
done

if [ "$set_ok" = false ]; then
  echo "ERROR: failed to set Cloud Run env vars."
  sed -n '1,40p' /tmp/openclaw_oauth_set.err || true
  exit 2
fi

VAR_JSON="$(tnf_cloud_run_env_json "$SERVICE")"
REMOTE_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_PRIMARY // empty')"
REMOTE_USE_CODEX="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_USE_CODEX_OAUTH // empty')"
REMOTE_FALLBACKS="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_MODEL_FALLBACKS // empty')"
REMOTE_AGENT_PRIMARY="$(printf '%s' "$VAR_JSON" | jq -r '.OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY // empty')"
PUBLIC_DOMAIN="$(printf '%s' "$VAR_JSON" | jq -r '.CLOUD_RUNTIME_PUBLIC_DOMAIN // .TNF_PUBLIC_DOMAIN // empty')"
if [ -z "$PUBLIC_DOMAIN" ]; then
  PUBLIC_DOMAIN="$(gcloud run services describe "$SERVICE" \
    --project="$(tnf_gcp_project)" \
    --region="$(tnf_gcp_region)" \
    --format='value(status.url)' 2>/dev/null | sed 's#^https://##' || true)"
fi

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
  echo "Waiting for Cloud Run service $SERVICE to become ready..."
  if ! tnf_cloud_run_wait_ready "$SERVICE" "$MAX_STATUS_RETRIES" "$SLEEP_SECONDS"; then
    exit 4
  fi
fi

if [ -n "$PUBLIC_DOMAIN" ]; then
  skip_overview="${OPENCLAW_SKIP_OVERVIEW_CHECK:-false}"
  if [[ "$PUBLIC_DOMAIN" == *"openclaw-sandbox-cloud"* ]]; then
    skip_overview=true
  fi

  if [ "$skip_overview" != "true" ]; then
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
  fi

  HEALTH_URL="https://${PUBLIC_DOMAIN}/health"
  for attempt in $(seq 1 20); do
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
