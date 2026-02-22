#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

load_env_file_if_unset() {
  local file="$1"
  [ -f "$file" ] || return 0

  while IFS='=' read -r raw_key raw_value; do
    local key
    key="$(echo "${raw_key:-}" | tr -d '[:space:]')"
    [ -n "$key" ] || continue
    [[ "$key" =~ ^# ]] && continue

    local value="${raw_value:-}"
    value="${value%$'\r'}"
    value="$(echo "$value" | sed -e "s/^[[:space:]]*//" -e "s/[[:space:]]*$//")"
    if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [ -z "${!key+x}" ]; then
      export "$key=$value"
    fi
  done < "$file"
}

load_env_file_if_unset ".env.local"
load_env_file_if_unset ".env"

export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6380}"
export REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
export REDIS_PORT="${REDIS_PORT:-6380}"
export SEARXNG_BASE_URL="${SEARXNG_BASE_URL:-http://127.0.0.1:8080}"

echo "🌀 Running live TNF supercycle with:"
echo "   REDIS_URL=$REDIS_URL"
echo "   SEARXNG_BASE_URL=$SEARXNG_BASE_URL"

node scripts/orchestrator/supercycle-flywheel.cjs
