#!/usr/bin/env bash
set -euo pipefail

# Decommissions MCP-DRS marketplace-related runtime deployments.
# Note: this script removes deployments; it does not delete services.

MCP_DRS_PROJECT_ID="${MCP_DRS_PROJECT_ID:-d9f3179e-fbc6-43b6-bd9b-eb0f4fb1068b}"
MCP_DRS_ENV="${MCP_DRS_ENV:-production}"

SERVICES=(
  "ai-assets-marketplace-data"
  "mcp-drs-crawler"
  "postgres-main"
  "mcp-drs-api"
  "mcp-drs-server"
  "mcp-drs-processor"
  "function-bun"
)

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

need_cmd railway

echo "Linking MCP-DRS project..."
railway link -p "$MCP_DRS_PROJECT_ID" -e "$MCP_DRS_ENV" >/dev/null

for svc in "${SERVICES[@]}"; do
  echo "Removing latest deployment for: $svc"
  railway down --service "$svc" --environment "$MCP_DRS_ENV" -y || true
done

echo
echo "Current status for MCP-DRS services:"
railway service status --all
