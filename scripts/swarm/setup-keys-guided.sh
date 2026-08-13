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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
if [[ -f "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh" ]]; then
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"
fi

if command -v gcloud >/dev/null 2>&1 && declare -F tnf_cloud_run_update_env >/dev/null 2>&1; then
  if gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n1 | grep -q '.'; then
    IFS=',' read -r -a RUNNER_SERVICES <<< "$RUNNER_SERVICES_CSV"
    echo "☁️  Pushing scout vars to Cloud Run services: ${RUNNER_SERVICES[*]}"
    for svc in "${RUNNER_SERVICES[@]}"; do
      env_pairs=("SCOUT_PROVIDER=$DEFAULT_PROVIDER")
      if [ -n "$TAVILY_API_KEY" ]; then
        env_pairs+=("TAVILY_API_KEY=$TAVILY_API_KEY")
      fi
      if [ -n "$EXA_API_KEY" ]; then
        env_pairs+=("EXA_API_KEY=$EXA_API_KEY")
      fi
      if tnf_cloud_run_update_env "$svc" "${env_pairs[@]}" >/dev/null 2>&1; then
        echo "   ✅ $svc"
      else
        echo "   ⚠️ $svc (skipped or unavailable)"
      fi
    done
  else
    echo "ℹ️ gcloud not authenticated; skipped Cloud Run variable sync."
  fi
else
  echo "ℹ️ gcloud / tnf-cloud-run helper unavailable; skipped remote variable sync."
  echo "   (legacy cloud_runtime CLI is retired)"
fi

echo ""
echo "Next commands:"
echo "  pnpm run swarm:provider:test"
echo "  pnpm run swarm:setup:nodocker"
echo "  pnpm run swarm:supercycle:live"
