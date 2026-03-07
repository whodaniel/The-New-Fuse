#!/usr/bin/env bash
#
# Check Railway Service Status
#
echo "🔍 Checking Railway Service Status..."
echo "======================================"
echo ""

ROOT_DIR="."

declare -a SERVICE_PATHS=(
    "packages/core-vector-db:Core Vector DB"
    "packages/relay-core:Relay Core"
    "packages/backend:Backend Package"
    "packages/api:API Package"
    "apps/backend:Backend App"
    "apps/api:API App"
    "apps/api-gateway:API Gateway"
    "apps/frontend:Frontend"
)

for service_entry in "${SERVICE_PATHS[@]}"; do
    IFS=':' read -r service_path service_name <<< "$service_entry"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 $service_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$ROOT_DIR/$service_path"

    # Get service info
    echo "Status:"
    railway status 2>&1 || echo "Could not get status"

    echo ""
    echo "Recent logs (last 10 lines):"
    railway logs --limit 10 2>&1 | tail -10 || echo "No logs available"

    echo ""
    sleep 1
done

cd "$ROOT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Service check complete"
echo ""
echo "To view detailed logs for a service:"
echo "  cd [service-path]"
echo "  railway logs"
