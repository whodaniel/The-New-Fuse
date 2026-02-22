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
PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY:-}"
TAVILY_API_KEY="${TAVILY_API_KEY:-}"
SCOUT_PROVIDER="${SCOUT_PROVIDER:-auto}"

if [ -z "$REDIS_URL" ]; then
  echo "❌ REDIS_URL is not set."
  echo "   Example: export REDIS_URL=redis://127.0.0.1:6379"
  exit 1
fi

if [ "$SCOUT_PROVIDER" = "perplexity" ] && [ -z "$PERPLEXITY_API_KEY" ]; then
  echo "❌ SCOUT_PROVIDER=perplexity but PERPLEXITY_API_KEY is not set."
  exit 1
fi

if [ "$SCOUT_PROVIDER" = "tavily" ] && [ -z "$TAVILY_API_KEY" ]; then
  echo "❌ SCOUT_PROVIDER=tavily but TAVILY_API_KEY is not set."
  exit 1
fi

if [ "$SCOUT_PROVIDER" = "searxng" ] && [ -z "$SEARXNG_BASE_URL" ]; then
  echo "❌ SCOUT_PROVIDER=searxng but SEARXNG_BASE_URL is not set."
  exit 1
fi

if [ "$SCOUT_PROVIDER" = "auto" ] && [ -z "$PERPLEXITY_API_KEY" ] && [ -z "$TAVILY_API_KEY" ] && [ -z "$SEARXNG_BASE_URL" ]; then
  echo "❌ No scout provider configured."
  echo "   Set PERPLEXITY_API_KEY, TAVILY_API_KEY, or SEARXNG_BASE_URL."
  exit 1
fi

REDIS_HOSTPORT="${REDIS_URL#redis://}"
REDIS_HOSTPORT="${REDIS_HOSTPORT#rediss://}"
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
if ! redis-cli -u "$REDIS_URL" --no-auth-warning ping | grep -q PONG; then
  echo "❌ Redis ping failed at $REDIS_HOST:$REDIS_PORT"
  exit 1
fi
echo "✅ Redis is reachable"

if [ -n "$PERPLEXITY_API_KEY" ] && [ "$SCOUT_PROVIDER" != "searxng" ]; then
  echo "🔍 Checking Perplexity API ..."
  if ! curl -fsS "https://api.perplexity.ai/chat/completions" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -d '{"model":"sonar","messages":[{"role":"user","content":"Reply with exactly: ok"}],"max_tokens":8}' \
    >/dev/null; then
    echo "❌ Perplexity API check failed"
    if [ "$SCOUT_PROVIDER" = "perplexity" ]; then
      exit 1
    fi
  else
    echo "✅ Perplexity is reachable"
  fi
fi

if [ -n "$TAVILY_API_KEY" ] && [ "$SCOUT_PROVIDER" != "searxng" ]; then
  echo "🔍 Checking Tavily API ..."
  if ! curl -fsS "https://api.tavily.com/search" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TAVILY_API_KEY" \
    -d '{"query":"latest free llm api","topic":"news","search_depth":"basic","max_results":1}' \
    >/dev/null; then
    echo "❌ Tavily API check failed"
    if [ "$SCOUT_PROVIDER" = "tavily" ]; then
      exit 1
    fi
  else
    echo "✅ Tavily is reachable"
  fi
fi

if [ -n "$SEARXNG_BASE_URL" ] && [ "$SCOUT_PROVIDER" != "perplexity" ]; then
  echo "🔍 Checking SearXNG at $SEARXNG_BASE_URL ..."
  if ! curl -fsS "${SEARXNG_BASE_URL%/}/search?q=tnf&format=json" >/dev/null; then
    echo "❌ SearXNG health check failed at ${SEARXNG_BASE_URL%/}/search"
    if [ "$SCOUT_PROVIDER" = "searxng" ]; then
      exit 1
    fi
  else
    echo "✅ SearXNG is reachable"
  fi
fi

echo ""
echo "✅ [TNF Setup: No Docker] Live external services validated"
echo "   REDIS_URL=$REDIS_URL"
echo "   SCOUT_PROVIDER=$SCOUT_PROVIDER"
if [ -n "$SEARXNG_BASE_URL" ]; then
  echo "   SEARXNG_BASE_URL=$SEARXNG_BASE_URL"
fi
if [ -n "$PERPLEXITY_API_KEY" ]; then
  echo "   PERPLEXITY_API_KEY=<set>"
fi
if [ -n "$TAVILY_API_KEY" ]; then
  echo "   TAVILY_API_KEY=<set>"
fi
echo ""
echo "Next:"
echo "  pnpm run swarm:supercycle:live"
