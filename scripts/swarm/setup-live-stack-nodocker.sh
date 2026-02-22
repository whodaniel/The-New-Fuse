#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_LOCAL="$ROOT_DIR/.env.local"
ENV_TEMPLATE="$ROOT_DIR/.env.local.template"

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

echo "🛠️  [TNF Setup: No Docker] Validating live external services..."

if [ ! -f "$ENV_LOCAL" ] && [ -f "$ENV_TEMPLATE" ]; then
  cp "$ENV_TEMPLATE" "$ENV_LOCAL"
  echo "✅ Created .env.local from template"
fi

load_env_file_if_unset "$ENV_LOCAL"
load_env_file_if_unset "$ROOT_DIR/.env"

REDIS_URL="${REDIS_URL:-}"
SEARXNG_BASE_URL="${SEARXNG_BASE_URL:-}"

if [ -z "$REDIS_URL" ]; then
  echo "❌ REDIS_URL is not set."
  echo "   Example: export REDIS_URL=redis://127.0.0.1:6379"
  exit 1
fi

if [ -z "$SEARXNG_BASE_URL" ]; then
  echo "❌ SEARXNG_BASE_URL is not set."
  echo "   Example: export SEARXNG_BASE_URL=http://127.0.0.1:8080"
  exit 1
fi

REDIS_HOSTPORT="${REDIS_URL#redis://}"
REDIS_HOSTPORT="${REDIS_HOSTPORT%%/*}"
REDIS_HOSTPORT="${REDIS_HOSTPORT##*@}"
REDIS_HOST="${REDIS_HOSTPORT%%:*}"
REDIS_PORT="${REDIS_HOSTPORT##*:}"

if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ] || [ "$REDIS_HOST" = "$REDIS_PORT" ]; then
  echo "❌ Could not parse REDIS_URL='$REDIS_URL' (expected redis://host:port)"
  exit 1
fi

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "❌ redis-cli is required for no-docker validation but not found."
  exit 1
fi

echo "🔍 Checking Redis at $REDIS_HOST:$REDIS_PORT ..."
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q PONG; then
  echo "❌ Redis ping failed at $REDIS_HOST:$REDIS_PORT"
  exit 1
fi
echo "✅ Redis is reachable"

echo "🔍 Checking SearXNG at $SEARXNG_BASE_URL ..."
if ! curl -fsS "${SEARXNG_BASE_URL%/}/search?q=tnf&format=json" >/dev/null; then
  echo "❌ SearXNG health check failed at ${SEARXNG_BASE_URL%/}/search"
  exit 1
fi
echo "✅ SearXNG is reachable"

echo ""
echo "✅ [TNF Setup: No Docker] Live external services validated"
echo "   REDIS_URL=$REDIS_URL"
echo "   SEARXNG_BASE_URL=$SEARXNG_BASE_URL"
echo ""
echo "Next:"
echo "  pnpm run swarm:supercycle:live"
