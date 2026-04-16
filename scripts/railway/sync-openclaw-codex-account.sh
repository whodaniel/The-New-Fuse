#!/usr/bin/env bash

set -euo pipefail

SERVICE="${OPENCLAW_RAILWAY_SERVICE:-openclaw-cloud}"
PRIMARY_MODEL="${OPENCLAW_MODEL_PRIMARY_OVERRIDE:-model-auto}"
FALLBACK_MODELS="${OPENCLAW_MODEL_FALLBACKS_OVERRIDE:-fallback-auto}"
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
  --primary-model MODEL   Primary model key (default: model-auto)
  --fallbacks CSV         Fallback model list (default: fallback-auto)
  --no-wait               Skip deployment wait loop
  -h, --help              Show this help

What it does:
  1) Reads local Codex OAuth tokens from ~/.codex/auth.json
  2) Syncs OPENAI_CODEX_* vars to Railway service
  3) Forces Codex OAuth active with specified primary model
  4) Verifies account/model vars and optionally waits for SUCCESS deploy
EOF
}
...
# Rest of the file unchanged, it uses the variables defined at the top
...
