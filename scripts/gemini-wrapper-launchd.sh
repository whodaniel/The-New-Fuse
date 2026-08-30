#!/bin/bash
# Launchd-safe Gemini Redis wrapper launcher.
# Honors adaptive harness: when primary is non-Google, park instead of spam-looping.
set -euo pipefail

export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$HOME/.hermes/node/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Fleet-wide pause gate (2026-07-21) ---
source "${REPO_ROOT}/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

HARNESS_ENV="${TNF_HARNESS_CONTEXT_ENV:-$REPO_ROOT/.agent/runtime-state/harness-context.env}"
HARNESS_RESOLVER="$REPO_ROOT/scripts/runtime/resolve-harness-context.cjs"

cd "$REPO_ROOT"

if [[ -f "$HARNESS_RESOLVER" ]]; then
  node "$HARNESS_RESOLVER" >/dev/null 2>&1 || true
fi
if [[ -f "$HARNESS_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$HARNESS_ENV"
  set +a
fi

# Optional local secrets (must not override harness primary/skip flags if already set)
if [[ -f $HOME/.tnf-claude-env ]]; then
  # shellcheck disable=SC1091
  source $HOME/.tnf-claude-env
fi

export AGENT_ID="${AGENT_ID:-tnf-gemini-redis-wrapper}"

if [[ "${TNF_FORCE_GEMINI_WRAPPER:-0}" != "1" ]] && {
  [[ "${GEMINI_DISABLED:-0}" == "1" ]] || [[ "${TNF_SKIP_GEMINI_WRAPPER:-0}" == "1" ]]
}; then
  echo "[gemini-launchd] parked: GEMINI_DISABLED/TNF_SKIP_GEMINI_WRAPPER=1 (set TNF_FORCE_GEMINI_WRAPPER=1 to run)"
  # KeepAlive-friendly park: stay alive without hitting Google quota.
  while true; do
    sleep 3600
    if [[ -f "$HARNESS_RESOLVER" ]]; then
      node "$HARNESS_RESOLVER" >/dev/null 2>&1 || true
    fi
    if [[ -f "$HARNESS_ENV" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$HARNESS_ENV"
      set +a
    fi
    if [[ "${TNF_FORCE_GEMINI_WRAPPER:-0}" == "1" ]]; then
      break
    fi
    if [[ "${GEMINI_DISABLED:-0}" != "1" && "${TNF_SKIP_GEMINI_WRAPPER:-0}" != "1" ]]; then
      break
    fi
  done
fi

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "[gemini-launchd] FATAL: node not found on PATH=$PATH" >&2
  exit 127
fi

exec "$NODE_BIN" "$REPO_ROOT/scripts/gemini-redis-wrapper.cjs"
