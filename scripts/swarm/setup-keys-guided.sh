#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_LOCAL="$ROOT_DIR/.env.local"
ENV_TEMPLATE="$ROOT_DIR/.env.local.template"
ENVIRONMENT="${CLOUD_RUNTIME_ENVIRONMENT_NAME:-production}"
RUNNER_SERVICES_CSV="${CLOUD_RUNTIME_RUNNER_SERVICES:-api3,api,backend}"

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -qE "^${key}=" "$file"; then
    sed -i '' "s#^${key}=.*#${key}=${value}#g" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

echo "🔐 TNF Guided Key Setup"
echo "   This script will ask for API keys and configure local + CloudRuntime vars."

if [ ! -f "$ENV_LOCAL" ]; then
  if [ -f "$ENV_TEMPLATE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_LOCAL"
  else
    touch "$ENV_LOCAL"
  fi
fi

if command -v open >/dev/null 2>&1; then
  open "https://app.tavily.com/playground" || true
  open "https://dashboard.exa.ai" || true
fi

echo ""
echo "Authenticate in the opened tabs, then paste keys below."
echo "Leave blank to skip any provider."
echo ""

read -r -p "Tavily API Key: " TAVILY_API_KEY
read -r -p "Exa API Key: " EXA_API_KEY

DEFAULT_PROVIDER="auto"
if [ -n "$TAVILY_API_KEY" ] && [ -z "$EXA_API_KEY" ]; then
  DEFAULT_PROVIDER="tavily"
elif [ -n "$EXA_API_KEY" ] && [ -z "$TAVILY_API_KEY" ]; then
  DEFAULT_PROVIDER="exa"
fi

upsert_env "$ENV_LOCAL" "SCOUT_PROVIDER" "$DEFAULT_PROVIDER"

if [ -n "$TAVILY_API_KEY" ]; then
  upsert_env "$ENV_LOCAL" "TAVILY_API_KEY" "$TAVILY_API_KEY"
fi

if [ -n "$EXA_API_KEY" ]; then
  upsert_env "$ENV_LOCAL" "EXA_API_KEY" "$EXA_API_KEY"
fi

echo "✅ Local .env.local updated"

if command -v cloud_runtime >/dev/null 2>&1 && cloud_runtime whoami >/dev/null 2>&1; then
  IFS=',' read -r -a RUNNER_SERVICES <<< "$RUNNER_SERVICES_CSV"
  echo "🚄 Pushing vars to CloudRuntime services: ${RUNNER_SERVICES[*]}"
  for svc in "${RUNNER_SERVICES[@]}"; do
    set_cmd=(cloud_runtime variable set -s "$svc" -e "$ENVIRONMENT" "SCOUT_PROVIDER=$DEFAULT_PROVIDER")
    if [ -n "$TAVILY_API_KEY" ]; then
      set_cmd+=("TAVILY_API_KEY=$TAVILY_API_KEY")
    fi
    if [ -n "$EXA_API_KEY" ]; then
      set_cmd+=("EXA_API_KEY=$EXA_API_KEY")
    fi
    if "${set_cmd[@]}" >/dev/null 2>&1; then
      echo "   ✅ $svc"
    else
      echo "   ⚠️ $svc (skipped or unavailable)"
    fi
  done
else
  echo "ℹ️ CloudRuntime CLI not authenticated; skipped CloudRuntime variable sync."
fi

echo ""
echo "Next commands:"
echo "  pnpm run swarm:provider:test"
echo "  pnpm run swarm:setup:nodocker"
echo "  pnpm run swarm:supercycle:live"
