#!/usr/bin/env bash
# Thin wrapper: Codex OAuth sync → sync-openclaw-oauth-instance.sh (gcloud/Cloud Run).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SERVICE="${OPENCLAW_CLOUD_RUNTIME_SERVICE:-openclaw-cloud}"
AUTH_FILE="${CODEX_AUTH_FILE:-$HOME/.codex/auth.json}"
PRIMARY_MODEL="${OPENCLAW_MODEL_PRIMARY_OVERRIDE:-openai-codex/gpt-5.3-codex}"
FALLBACK_MODELS="${OPENCLAW_MODEL_FALLBACKS_OVERRIDE:-openai-codex/gpt-5.2-codex}"
INSTANCE_ID="${OPENCLAW_INSTANCE_ID:-}"
INSTANCE_NAME="${OPENCLAW_INSTANCE_NAME:-}"
EXTRA=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/cloud-run/sync-openclaw-codex-account.sh [options]

Delegates to sync-openclaw-oauth-instance.sh --provider openai-codex (gcloud/Cloud Run).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --service) SERVICE="${2:-}"; shift 2 ;;
    --auth-file) AUTH_FILE="${2:-}"; shift 2 ;;
    --codex-home) AUTH_FILE="${2:-}/auth.json"; shift 2 ;;
    --instance-id) INSTANCE_ID="${2:-}"; shift 2 ;;
    --instance-name) INSTANCE_NAME="${2:-}"; shift 2 ;;
    --primary-model) PRIMARY_MODEL="${2:-}"; shift 2 ;;
    --fallbacks) FALLBACK_MODELS="${2:-}"; shift 2 ;;
    --no-wait) EXTRA+=(--no-wait); shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown argument: $1"; usage; exit 1 ;;
  esac
done

exec bash scripts/cloud-run/sync-openclaw-oauth-instance.sh \
  --service "$SERVICE" \
  --provider openai-codex \
  --auth-file "$AUTH_FILE" \
  --primary-model "$PRIMARY_MODEL" \
  --fallbacks "$FALLBACK_MODELS" \
  --instance-id "$INSTANCE_ID" \
  --instance-name "$INSTANCE_NAME" \
  "${EXTRA[@]}"
