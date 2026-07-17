#!/usr/bin/env bash
# launch-agent-wrapper.sh — adaptive harness entry for TNF agent Terminals.
# Usage: launch-agent-wrapper.sh <wrapper.cjs> [extra env assignments...]
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

exec node "$WRAPPER"
