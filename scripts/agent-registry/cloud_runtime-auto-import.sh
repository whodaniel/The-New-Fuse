#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SERVICE="${AGENT_REGISTRY_SERVICE:-backend}"
ENVIRONMENT="${AGENT_REGISTRY_ENVIRONMENT:-production}"
API_BASE="${AGENT_REGISTRY_API_BASE:-}"
HEALTH_PATH="${AGENT_REGISTRY_HEALTH_PATH:-/health}"

say() { printf "%s\n" "$*"; }

usage() {
  cat <<'EOF'
Usage: cloud_runtime-auto-import.sh

Environment:
  AGENT_REGISTRY_SERVICE=backend
  AGENT_REGISTRY_ENVIRONMENT=production
  AGENT_REGISTRY_API_BASE=https://backend-production-xxxx.thenewfuse.com
  AGENT_REGISTRY_HEALTH_PATH=/health
  AGENT_REGISTRY_AUTO_COMMIT=1
  AGENT_REGISTRY_AUTO_PUSH=1
  AGENT_REGISTRY_IMPORT_TOKEN=your-token
EOF
}

if [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "cloud_runtime CLI not found. Install with: npm i -g @cloud_runtime/cli" >&2
  exit 1
fi

if ! cloud_runtime whoami >/dev/null 2>&1; then
  echo "Not logged into CloudRuntime. Run: cloud_runtime login" >&2
  exit 1
fi

if [ -z "$API_BASE" ]; then
  VARS="$(cloud_runtime variable list -s "$SERVICE" -e "$ENVIRONMENT" -k 2>/dev/null || true)"
  for key in BACKEND_URL API_URL API_GATEWAY_URL API_BASE_URL; do
    if echo "$VARS" | rg -q "^${key}="; then
      API_BASE="$(echo "$VARS" | rg "^${key}=" | head -n1 | cut -d= -f2-)"
      break
    fi
  done
fi

if [ -z "$API_BASE" ]; then
  API_BASE="$(cloud_runtime domain -s "$SERVICE" -e "$ENVIRONMENT" 2>/dev/null | rg -o 'https?://[^[:space:]]+' -m 1 || true)"
fi

if [ -z "${AGENT_REGISTRY_IMPORT_TOKEN:-}" ]; then
  VARS_FOR_TOKEN="$(cloud_runtime variable list -s "$SERVICE" -e "$ENVIRONMENT" -k 2>/dev/null || true)"
  if echo "$VARS_FOR_TOKEN" | rg -q "^AGENT_REGISTRY_IMPORT_TOKEN="; then
    AGENT_REGISTRY_IMPORT_TOKEN="$(echo "$VARS_FOR_TOKEN" | rg "^AGENT_REGISTRY_IMPORT_TOKEN=" | head -n1 | cut -d= -f2-)"
    export AGENT_REGISTRY_IMPORT_TOKEN
  fi
fi

if [ -z "$API_BASE" ]; then
  echo "Could not determine API base. Set AGENT_REGISTRY_API_BASE." >&2
  exit 1
fi

say "[registry] target=${API_BASE} service=${SERVICE} env=${ENVIRONMENT}"
say "[registry] building snapshot"
node scripts/agent-registry/build-agent-registry.mjs

if git status --porcelain data/agent-registry | rg -q '.'; then
  if [ "${AGENT_REGISTRY_AUTO_COMMIT:-}" = "1" ]; then
    git add data/agent-registry
    git commit -m "chore(agent-registry): update snapshot" || true
    if [ "${AGENT_REGISTRY_AUTO_PUSH:-}" = "1" ]; then
      git push || true
    fi
  else
    say "[registry] snapshot updated locally; commit/push to deploy or set AGENT_REGISTRY_AUTO_COMMIT=1"
  fi
fi

if ! curl -fsS "${API_BASE}${HEALTH_PATH}" >/dev/null 2>&1; then
  echo "Health check failed: ${API_BASE}${HEALTH_PATH}" >&2
  exit 1
fi

say "[registry] importing snapshot"
AGENT_REGISTRY_API_BASE="$API_BASE" AGENT_REGISTRY_SNAPSHOT_PATH="data/agent-registry/agents.json" \
  node scripts/agent-registry/import-agent-registry-snapshot.mjs
say "[registry] import complete"
