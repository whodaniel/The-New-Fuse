#!/usr/bin/env bash
# launch-agent-wrapper.sh — adaptive harness entry for TNF agent Terminals.
# Usage: launch-agent-wrapper.sh <wrapper.cjs> [extra env assignments...]
#
# When the tnf-agent OS account exists, wrappers are launched as that user
# (kernel boundary for the operator key). Override with TNF_RUN_AS_OPERATOR=1
# only for deliberate operator-side debugging — that defeats isolation.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${TNF_HARNESS_CONTEXT_ENV:-$ROOT/.agent/runtime-state/harness-context.env}"
RESOLVER="$ROOT/scripts/runtime/resolve-harness-context.cjs"
WRAPPER="${1:-}"
shift || true

if [[ -z "$WRAPPER" ]]; then
  echo "Usage: $0 <path-to-wrapper.cjs>" >&2
  exit 2
fi

# Refresh context if missing/stale (resolver has its own TTL).
if [[ -f "$RESOLVER" ]]; then
  node "$RESOLVER" >/dev/null 2>&1 || true
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

export TNF_ONBOARDED=1
export TNF_HARNESS_ADAPTIVE="${TNF_HARNESS_ADAPTIVE:-1}"
cd "$ROOT"

# Optional KEY=value pairs after wrapper path
while [[ $# -gt 0 ]]; do
  if [[ "$1" == *=* ]]; then
    export "$1"
  fi
  shift
done

# Resolve absolute wrapper path before any uid switch.
case "$WRAPPER" in
  /*) ;;
  *) WRAPPER="$ROOT/$WRAPPER" ;;
esac
if [[ ! -f "$WRAPPER" ]]; then
  echo "Wrapper not found: $WRAPPER" >&2
  exit 2
fi

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "node not found on PATH=$PATH" >&2
  exit 127
fi

AGENT_USER="${TNF_AGENT_USER:-tnf-agent}"
should_run_as_agent() {
  [[ "${TNF_RUN_AS_OPERATOR:-0}" == "1" ]] && return 1
  id -u "$AGENT_USER" >/dev/null 2>&1 || return 1
  [[ "$(id -un)" == "$AGENT_USER" ]] && return 1
  return 0
}

if should_run_as_agent; then
  echo "[tnf-launcher] dropping to ${AGENT_USER} for $(basename "$WRAPPER")" >&2
  # Pass a minimal env: PATH (so node resolves), harness flags, agent id.
  # Do NOT forward the operator HOME — that would keep the key in reach via cwd tricks.
  exec sudo -u "$AGENT_USER" \
    env \
      PATH="$PATH" \
      TNF_ONBOARDED="${TNF_ONBOARDED:-1}" \
      TNF_HARNESS_ADAPTIVE="${TNF_HARNESS_ADAPTIVE:-1}" \
      TNF_HARNESS_CONTEXT_ENV="$ENV_FILE" \
      TNF_AGENT_USER="$AGENT_USER" \
      AGENT_ID="${AGENT_ID:-}" \
      AGENT_NAME="${AGENT_NAME:-}" \
      REDIS_URL="${REDIS_URL:-}" \
      A2A_SECRET_KEY="${A2A_SECRET_KEY:-}" \
      TNF_MESSAGE_AUTH_MODE="${TNF_MESSAGE_AUTH_MODE:-}" \
      TNF_AUTHORITY_CONSUMER="${TNF_AUTHORITY_CONSUMER:-}" \
    "$NODE_BIN" "$WRAPPER"
fi

exec "$NODE_BIN" "$WRAPPER"
