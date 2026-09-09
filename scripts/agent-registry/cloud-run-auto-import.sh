#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

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
  AGENT_REGISTRY_API_BASE=https://backend-....run.app   (preferred)
  AGENT_REGISTRY_HEALTH_PATH=/health
  AGENT_REGISTRY_AUTO_COMMIT=1
  AGENT_REGISTRY_AUTO_PUSH=1
  AGENT_REGISTRY_IMPORT_TOKEN=your-token
  TNF_GCP_PROJECT_ID / TNF_GCP_REGION  (when resolving URL via gcloud)
EOF
}

if [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ -z "$API_BASE" ]; then
  if command -v gcloud >/dev/null 2>&1; then
    tnf_require_gcloud
    API_BASE="$(gcloud run services describe "$SERVICE" \
      --project="$(tnf_gcp_project)" \
      --region="$(tnf_gcp_region)" \
      --format='value(status.url)' 2>/dev/null || true)"
    if [ -z "${AGENT_REGISTRY_IMPORT_TOKEN:-}" ]; then
      VAR_JSON="$(tnf_cloud_run_env_json "$SERVICE" 2>/dev/null || true)"
      AGENT_REGISTRY_IMPORT_TOKEN="$(printf '%s' "$VAR_JSON" | jq -r '.AGENT_REGISTRY_IMPORT_TOKEN // empty')"
      if [ -n "${AGENT_REGISTRY_IMPORT_TOKEN}" ]; then
        export AGENT_REGISTRY_IMPORT_TOKEN
      fi
    fi
  else
    echo "Set AGENT_REGISTRY_API_BASE (gcloud not available to auto-resolve)." >&2
    tnf_cloud_runtime_retired_msg
    exit 1
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
