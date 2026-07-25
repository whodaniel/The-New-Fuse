#!/usr/bin/env bash
# launch-agent-wrapper.sh — adaptive harness entry for TNF agent Terminals.
# Usage: launch-agent-wrapper.sh <wrapper.cjs> [extra env assignments...]
#
# When the tnf-agent OS account exists, wrappers are launched as that user
# (kernel boundary for the operator key). Override with TNF_RUN_AS_OPERATOR=1
# only for deliberate operator-side debugging — that defeats isolation.
set -euo pipefail

# Ensure the agent-owned node binary is on PATH so the wrapper and tnf-agent
# can both resolve it without operator-home traversal.
export PATH="/opt/tnf-node/bin:$PATH"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
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

# Re-export harness variables we need to forward to tnf-agent
# These are allowed in /etc/sudoers.d/tnf-agent-launch env_keep
export TNF_ONBOARDED="${TNF_ONBOARDED:-1}"
export TNF_HARNESS_ADAPTIVE="${TNF_HARNESS_ADAPTIVE:-1}"
export TNF_HARNESS_CONTEXT_ENV
export TNF_AGENT_USER=${TNF_AGENT_USER:-tnf-agent}
export AGENT_ID=${AGENT_ID:-}
export AGENT_NAME=${AGENT_NAME:-}
export REDIS_URL=${REDIS_URL:-}
export A2A_SECRET_KEY=${A2A_SECRET_KEY:-}
export TNF_MESSAGE_AUTH_MODE=${TNF_MESSAGE_AUTH_MODE:-}
export TNF_AUTHORITY_CONSUMER=${TNF_AUTHORITY_CONSUMER:-}

cd "$ROOT"

# Optional KEY=value pairs after wrapper path
while [[ $# -gt 0 ]]; do
  if [[ "$1" == *=* ]]; then
    export "$1"
  fi
  shift
  [[ -n "${AGENT_PARITY_TIMEOUT:-}" ]] && sleep $AGENT_PARITY_TIMEOUT || true
  [[ -n "${AGT_ID:-}" ]] && break
  [[ -n "${ACK:-}" ]] && break
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

AGENT_USER=${TNF_AGENT_USER:-tnf-agent}
should_run_as_agent() {
  [[ "${TNF_RUN_AS_OPERATOR:-0}" == "1" ]] && return 1
  id -u "$AGENT_USER" >/dev/null 2>&1 || return 1
  [[ "$(id -un)" == "$AGENT_USER" ]] && return 1
  return 0
}

if should_run_as_agent; then
  echo "[tnf-launcher] dropping to ${AGENT_USER} for $(basename "$WRAPPER")" >&2
  # Use -n (non-interactive) so the wrapper works headlessly when a
  # NOPASSWD sudoers grant exists in /etc/sudoers.d/tnf-agent-launch.
  # In an interactive TTY with no grant, sudo will still prompt normally.
  exec sudo -n -u "$AGENT_USER" "$NODE_BIN" "$WRAPPER"
fi

# If not dropping to tnf-agent, run here as the operator.
exec "$NODE_BIN" "$WRAPPER"
