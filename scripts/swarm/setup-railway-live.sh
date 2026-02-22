#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${RAILWAY_ENVIRONMENT_NAME:-production}"
RUNNER_SERVICES_CSV="${RAILWAY_RUNNER_SERVICES:-api3,api,backend}"
SEARXNG_SERVICE="${RAILWAY_SEARXNG_SERVICE:-searxng}"
SEARXNG_IMAGE="${RAILWAY_SEARXNG_IMAGE:-searxng/searxng:latest}"
TAVILY_API_KEY="${TAVILY_API_KEY:-}"

echo "🚄 [TNF Railway Setup] Configuring live swarm stack in Railway..."
echo "   Environment: $ENVIRONMENT"
echo "   Runner Services: $RUNNER_SERVICES_CSV"
echo "   SearXNG Service: $SEARXNG_SERVICE"

IFS=',' read -r -a RUNNER_SERVICES <<< "$RUNNER_SERVICES_CSV"

if ! command -v railway >/dev/null 2>&1; then
  echo "❌ railway CLI is not installed."
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "❌ Not logged into Railway. Run: railway login"
  exit 1
fi

SERVICES_JSON="$(railway status --json)"

if ! echo "$SERVICES_JSON" | jq -e ".services.edges[] | select(.node.name == \"$SEARXNG_SERVICE\")" >/dev/null; then
  echo "➕ Creating Railway service '$SEARXNG_SERVICE' from image '$SEARXNG_IMAGE'..."
  railway add -s "$SEARXNG_SERVICE" -i "$SEARXNG_IMAGE" \
    --variables "BASE_URL=https://${SEARXNG_SERVICE}-production.up.railway.app/" \
    --variables "INSTANCE_NAME=TNF Scout Search" \
    >/dev/null
else
  echo "✅ Service '$SEARXNG_SERVICE' already exists"
fi

SEARXNG_DOMAIN=""
if DOMAIN_JSON="$(railway domain -s "$SEARXNG_SERVICE" --json 2>/dev/null)"; then
  SEARXNG_DOMAIN="$(echo "$DOMAIN_JSON" | jq -r '(.domain // .domains[0] // empty)')"
fi

if [ -z "$SEARXNG_DOMAIN" ]; then
  echo "ℹ️ Railway domain command did not return a domain; trying existing service variables..."
  for svc in "${RUNNER_SERVICES[@]}"; do
    EXISTING_BASE_URL="$(
      railway variable list -s "$svc" -e "$ENVIRONMENT" -k 2>/dev/null \
        | sed -n 's/^SEARXNG_BASE_URL=//p' \
        | head -n 1
    )"
    if [ -n "$EXISTING_BASE_URL" ]; then
      SEARXNG_DOMAIN="$EXISTING_BASE_URL"
      break
    fi
  done
fi

if [ -z "$SEARXNG_DOMAIN" ]; then
  echo "❌ Could not resolve a SearXNG URL."
  echo "   Generate one manually: railway domain -s $SEARXNG_SERVICE"
  exit 1
fi

if [[ "$SEARXNG_DOMAIN" == http://* || "$SEARXNG_DOMAIN" == https://* ]]; then
  SEARXNG_BASE_URL="$SEARXNG_DOMAIN"
else
  SEARXNG_BASE_URL="https://${SEARXNG_DOMAIN}"
fi

# Clean malformed values like https://https://example.com
SEARXNG_BASE_URL="$(echo "$SEARXNG_BASE_URL" | sed 's#^https://https://#https://#; s#^http://http://#http://#')"
echo "🌐 SearXNG URL: $SEARXNG_BASE_URL"

echo "🔧 Setting SEARXNG_BASE_URL on runner services..."
for svc in "${RUNNER_SERVICES[@]}"; do
  if railway variable set -s "$svc" -e "$ENVIRONMENT" \
    "SEARXNG_BASE_URL=$SEARXNG_BASE_URL" \
    "SEARXNG_NEWS_ENGINES=google,bing,duckduckgo" \
    >/dev/null 2>&1; then
    echo "   ✅ Updated $svc"
  else
    echo "   ⚠️ Skipped $svc (not found or no access)"
  fi
done

if [ -n "$TAVILY_API_KEY" ]; then
  echo "🔧 Setting TAVILY_API_KEY on runner services..."
  for svc in "${RUNNER_SERVICES[@]}"; do
    if railway variable set -s "$svc" -e "$ENVIRONMENT" \
      "TAVILY_API_KEY=$TAVILY_API_KEY" \
      "SCOUT_PROVIDER=auto" \
      >/dev/null 2>&1; then
      echo "   ✅ Updated $svc"
    else
      echo "   ⚠️ Skipped $svc (not found or no access)"
    fi
  done
fi

if ! railway variable list -s Redis -e "$ENVIRONMENT" -k 2>/dev/null | grep -q '^REDIS_PUBLIC_URL='; then
  echo "❌ REDIS_PUBLIC_URL missing on Railway Redis service."
  echo "   Ensure the Redis plugin/service is running."
  exit 1
fi

echo "✅ [TNF Railway Setup] Complete"
echo "   Runner services: $RUNNER_SERVICES_CSV"
echo "   SearXNG service: $SEARXNG_SERVICE"
echo "   SearXNG URL: $SEARXNG_BASE_URL"
echo ""
echo "Next:"
echo "  pnpm run swarm:supercycle:railway"
