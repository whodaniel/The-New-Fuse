#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${CLOUD_RUNTIME_ENVIRONMENT_NAME:-production}"
RUNNER_SERVICES_CSV="${CLOUD_RUNTIME_RUNNER_SERVICES:-api3,api,backend}"
SEARXNG_SERVICE="${CLOUD_RUNTIME_SEARXNG_SERVICE:-searxng}"
SEARXNG_IMAGE="${CLOUD_RUNTIME_SEARXNG_IMAGE:-searxng/searxng:latest}"
TAVILY_API_KEY="${TAVILY_API_KEY:-}"
EXA_API_KEY="${EXA_API_KEY:-}"
CRAWL4AI_ENABLED="${CRAWL4AI_ENABLED:-}"
CRAWL4AI_MAX_URLS="${CRAWL4AI_MAX_URLS:-}"
CRAWL4AI_MAX_CHARS="${CRAWL4AI_MAX_CHARS:-}"
CRAWL4AI_TIMEOUT_MS="${CRAWL4AI_TIMEOUT_MS:-}"

echo "🚄 [TNF CloudRuntime Setup] Configuring live swarm stack in CloudRuntime..."
echo "   Environment: $ENVIRONMENT"
echo "   Runner Services: $RUNNER_SERVICES_CSV"
echo "   SearXNG Service: $SEARXNG_SERVICE"

IFS=',' read -r -a RUNNER_SERVICES <<< "$RUNNER_SERVICES_CSV"

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "❌ cloud_runtime CLI is not installed."
  exit 1
fi

if ! cloud_runtime whoami >/dev/null 2>&1; then
  echo "❌ Not logged into CloudRuntime. Run: cloud_runtime login"
  exit 1
fi

SERVICES_JSON="$(cloud_runtime status --json)"

if ! echo "$SERVICES_JSON" | jq -e ".services.edges[] | select(.node.name == \"$SEARXNG_SERVICE\")" >/dev/null; then
  echo "➕ Creating CloudRuntime service '$SEARXNG_SERVICE' from image '$SEARXNG_IMAGE'..."
  cloud_runtime add -s "$SEARXNG_SERVICE" -i "$SEARXNG_IMAGE" \
    --variables "BASE_URL=https://${SEARXNG_SERVICE}-production.thenewfuse.com/" \
    --variables "INSTANCE_NAME=TNF Scout Search" \
    >/dev/null
else
  echo "✅ Service '$SEARXNG_SERVICE' already exists"
fi

SEARXNG_DOMAIN=""
if DOMAIN_JSON="$(cloud_runtime domain -s "$SEARXNG_SERVICE" --json 2>/dev/null)"; then
  SEARXNG_DOMAIN="$(echo "$DOMAIN_JSON" | jq -r '(.domain // .domains[0] // empty)')"
fi

if [ -z "$SEARXNG_DOMAIN" ]; then
  echo "ℹ️ CloudRuntime domain command did not return a domain; trying existing service variables..."
  for svc in "${RUNNER_SERVICES[@]}"; do
    EXISTING_BASE_URL="$(
      cloud_runtime variable list -s "$svc" -e "$ENVIRONMENT" -k 2>/dev/null \
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
  echo "   Generate one manually: cloud_runtime domain -s $SEARXNG_SERVICE"
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
  if cloud_runtime variable set -s "$svc" -e "$ENVIRONMENT" \
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
    if cloud_runtime variable set -s "$svc" -e "$ENVIRONMENT" \
      "TAVILY_API_KEY=$TAVILY_API_KEY" \
      "SCOUT_PROVIDER=auto" \
      >/dev/null 2>&1; then
      echo "   ✅ Updated $svc"
    else
      echo "   ⚠️ Skipped $svc (not found or no access)"
    fi
  done
fi

if [ -n "$EXA_API_KEY" ]; then
  echo "🔧 Setting EXA_API_KEY on runner services..."
  for svc in "${RUNNER_SERVICES[@]}"; do
    if cloud_runtime variable set -s "$svc" -e "$ENVIRONMENT" \
      "EXA_API_KEY=$EXA_API_KEY" \
      "SCOUT_PROVIDER=auto" \
      >/dev/null 2>&1; then
      echo "   ✅ Updated $svc"
    else
      echo "   ⚠️ Skipped $svc (not found or no access)"
    fi
  done
fi

if [ -n "$CRAWL4AI_ENABLED" ] || [ -n "$CRAWL4AI_MAX_URLS" ] || [ -n "$CRAWL4AI_MAX_CHARS" ] || [ -n "$CRAWL4AI_TIMEOUT_MS" ]; then
  echo "🔧 Setting Crawl4AI vars on runner services..."
  for svc in "${RUNNER_SERVICES[@]}"; do
    set_cmd=(cloud_runtime variable set -s "$svc" -e "$ENVIRONMENT")
    if [ -n "$CRAWL4AI_ENABLED" ]; then
      set_cmd+=("CRAWL4AI_ENABLED=$CRAWL4AI_ENABLED")
    fi
    if [ -n "$CRAWL4AI_MAX_URLS" ]; then
      set_cmd+=("CRAWL4AI_MAX_URLS=$CRAWL4AI_MAX_URLS")
    fi
    if [ -n "$CRAWL4AI_MAX_CHARS" ]; then
      set_cmd+=("CRAWL4AI_MAX_CHARS=$CRAWL4AI_MAX_CHARS")
    fi
    if [ -n "$CRAWL4AI_TIMEOUT_MS" ]; then
      set_cmd+=("CRAWL4AI_TIMEOUT_MS=$CRAWL4AI_TIMEOUT_MS")
    fi
    if "${set_cmd[@]}" >/dev/null 2>&1; then
      echo "   ✅ Updated $svc"
    else
      echo "   ⚠️ Skipped $svc (not found or no access)"
    fi
  done
fi

if ! cloud_runtime variable list -s Redis -e "$ENVIRONMENT" -k 2>/dev/null | grep -q '^REDIS_PUBLIC_URL='; then
  echo "❌ REDIS_PUBLIC_URL missing on CloudRuntime Redis service."
  echo "   Ensure the Redis plugin/service is running."
  exit 1
fi

echo "✅ [TNF CloudRuntime Setup] Complete"
echo "   Runner services: $RUNNER_SERVICES_CSV"
echo "   SearXNG service: $SEARXNG_SERVICE"
echo "   SearXNG URL: $SEARXNG_BASE_URL"
echo ""
echo "Next:"
echo "  pnpm run swarm:supercycle:live"
