#!/bin/bash
# Launchd-safe Pi Redis wrapper launcher.
# Prefer adaptive harness context over hard-coded Google defaults.
set -euo pipefail

export PATH="/Users/danielgoldberg/.nvm/versions/node/v20.20.2/bin:/Users/danielgoldberg/.hermes/node/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Fleet-wide pause gate (2026-07-21) ---
source "${REPO_ROOT}/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

HARNESS_ENV="${TNF_HARNESS_CONTEXT_ENV:-$REPO_ROOT/.agent/runtime-state/harness-context.env}"
HARNESS_RESOLVER="$REPO_ROOT/scripts/runtime/resolve-harness-context.cjs"
NODE_BIN="$(command -v node || true)"

cd "$REPO_ROOT"

if [[ -z "$NODE_BIN" ]]; then
  echo "[pi-launchd] FATAL: node not found on PATH=$PATH" >&2
  exit 127
fi

# Refresh / load adaptive context first so PI_* inherit catalog + profile.
if [[ -f "$HARNESS_RESOLVER" ]]; then
  "$NODE_BIN" "$HARNESS_RESOLVER" >/dev/null 2>&1 || true
fi
if [[ -f "$HARNESS_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$HARNESS_ENV"
  set +a
fi

# Defaults only when harness did not set them — never force google when nvidia is primary.
export AGENT_NAME="${AGENT_NAME:-pi}"
export AGENT_ROLE="${AGENT_ROLE:-worker}"
export PI_PROVIDER="${PI_PROVIDER:-${TNF_PROVIDER_FAMILY:-nvidia}}"
export PI_MODEL="${PI_MODEL:-${TNF_WORKING_MODEL:-thinkingmachines/inkling}}"
export PI_CMD="${PI_CMD:-pi}"
export PI_TIMEOUT_MS="${PI_TIMEOUT_MS:-180000}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# If something still points at google without credentials, refuse loudly instead of spam-looping.
if [[ "${PI_PROVIDER}" == "google" ]] && [[ -z "${GOOGLE_API_KEY:-}${GEMINI_API_KEY:-}" ]]; then
  echo "⚠️  PI_PROVIDER=google but no GOOGLE_API_KEY/GEMINI_API_KEY — re-resolving harness toward catalog primary..."
  if [[ -f "$HARNESS_RESOLVER" ]]; then
    "$NODE_BIN" "$HARNESS_RESOLVER" --force >/dev/null 2>&1 || true
    if [[ -f "$HARNESS_ENV" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$HARNESS_ENV"
      set +a
    fi
  fi
fi

exec "$NODE_BIN" "$REPO_ROOT/scripts/pi-redis-wrapper.cjs"
