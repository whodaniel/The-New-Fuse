#!/usr/bin/env bash
set -euo pipefail

# Audits Railway marketplace-related topology across TNF and MCP-DRS projects.
# Requires: railway CLI, jq

TNF_PROJECT_ID="${TNF_PROJECT_ID:-041cee9d-8648-4074-b5a6-0eae436de1d1}"
MCP_DRS_PROJECT_ID="${MCP_DRS_PROJECT_ID:-d9f3179e-fbc6-43b6-bd9b-eb0f4fb1068b}"
RAILWAY_ENV="${RAILWAY_ENV:-production}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

capture_project_status() {
  local project_id="$1"
  local out_json="$2"

  railway link -p "$project_id" >/dev/null
  railway status --json >"$out_json"
}

list_services() {
  local json_file="$1"
  jq -r --arg env "$RAILWAY_ENV" '
    .environments.edges[]
    | select(.node.name == $env)
    | .node.serviceInstances.edges[].node.serviceName
  ' "$json_file" | sort
}

service_meta() {
  local json_file="$1"
  local service_name="$2"
  jq -r --arg env "$RAILWAY_ENV" --arg svc "$service_name" '
    .environments.edges[]
    | select(.node.name == $env)
    | .node.serviceInstances.edges[]
    | select(.node.serviceName == $svc)
    | {
        service: .node.serviceName,
        builder: .node.latestDeployment.meta.serviceManifest.build.builder,
        nixpacksProviders: .node.latestDeployment.meta.nixpacksProviders,
        startCommand: .node.startCommand
      }
  ' "$json_file"
}

need_cmd railway
need_cmd jq

TNF_JSON="$TMP_DIR/tnf_status.json"
MCP_JSON="$TMP_DIR/mcp_drs_status.json"

echo "Capturing TNF status..."
capture_project_status "$TNF_PROJECT_ID" "$TNF_JSON"
echo "Capturing MCP-DRS status..."
capture_project_status "$MCP_DRS_PROJECT_ID" "$MCP_JSON"

echo
echo "=== TNF services ($RAILWAY_ENV) ==="
list_services "$TNF_JSON"

echo
echo "=== MCP-DRS services ($RAILWAY_ENV) ==="
list_services "$MCP_JSON"

echo
echo "=== Marketplace-related overlap scan ==="
for pattern in marketplace mcp-drs crawler api; do
  echo "pattern: $pattern"
  echo "  TNF:"
  list_services "$TNF_JSON" | rg -i "$pattern" || true
  echo "  MCP-DRS:"
  list_services "$MCP_JSON" | rg -i "$pattern" || true
done

echo
echo "=== Service runtime hints ==="
for svc in mcp-drs-crawler mcp-drs-api ai-assets-marketplace-data api "api-gateway"; do
  echo "service: $svc"
  service_meta "$MCP_JSON" "$svc" 2>/dev/null || true
  service_meta "$TNF_JSON" "$svc" 2>/dev/null || true
done

echo
echo "Audit complete."
