#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.dev-simple.yml"
ENV_LOCAL="$ROOT_DIR/.env.local"
ENV_TEMPLATE="$ROOT_DIR/.env.local.template"

append_if_missing() {
  local file="$1"
  local key="$2"
  local value="$3"
  if ! grep -Eq "^${key}=" "$file"; then
    echo "${key}=${value}" >> "$file"
  fi
}

echo "🛠️  [TNF Setup] Bootstrapping live swarm stack..."

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker not found. Install Docker Desktop first."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker daemon is not running."
  exit 1
fi

if [ ! -f "$ENV_LOCAL" ]; then
  if [ -f "$ENV_TEMPLATE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_LOCAL"
    echo "✅ Created .env.local from template"
  else
    touch "$ENV_LOCAL"
    echo "✅ Created empty .env.local"
  fi
fi

append_if_missing "$ENV_LOCAL" "REDIS_URL" "redis://127.0.0.1:6380"
append_if_missing "$ENV_LOCAL" "REDIS_HOST" "127.0.0.1"
append_if_missing "$ENV_LOCAL" "REDIS_PORT" "6380"
append_if_missing "$ENV_LOCAL" "SEARXNG_BASE_URL" "http://127.0.0.1:8080"
append_if_missing "$ENV_LOCAL" "SEARXNG_NEWS_ENGINES" "google,bing,duckduckgo"

echo "🚀 Starting Redis + SearXNG containers..."
docker-compose -f "$COMPOSE_FILE" up -d redis-dev searxng-dev

echo "⏳ Waiting for Redis..."
for _ in {1..30}; do
  if docker exec tnf-redis-dev redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is ready"
    break
  fi
  sleep 1
done

echo "⏳ Waiting for SearXNG..."
for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:8080/search?q=tnf&format=json" >/dev/null 2>&1; then
    echo "✅ SearXNG is ready"
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:8080/search?q=tnf&format=json" >/dev/null 2>&1; then
  echo "❌ SearXNG health check failed on http://127.0.0.1:8080"
  exit 1
fi

echo ""
echo "✅ [TNF Setup] Live stack ready"
echo "   Redis URL: redis://127.0.0.1:6380"
echo "   SearXNG:   http://127.0.0.1:8080"
echo ""
echo "Next:"
echo "  pnpm run swarm:supercycle:live"
