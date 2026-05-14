#!/usr/bin/env bash
#
# CloudRuntime Clean Deployment Script
# Deploys all SAAS services to CloudRuntime in correct order
#
set -e

echo "🚀 CloudRuntime Clean Deployment - The New Fuse"
echo "=========================================="
echo ""

# Verify CloudRuntime CLI
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI not installed. Install with: npm install -g @cloud_runtime/cli"
    exit 1
fi

# Verify authentication
if ! cloud_runtime whoami &> /dev/null; then
    echo "❌ Not logged in to CloudRuntime. Run: cloud_runtime login"
    exit 1
fi

echo "✅ CloudRuntime CLI ready"
echo ""

# Service deployment configuration
# Format: "service_name|path|description"
declare -a SERVICES=(
    "core-vector-db|packages/core-vector-db|Core Vector Database Service"
    "relay-core|packages/relay-core|Relay Core Service"
    "backend-package|packages/backend|Backend Package Service"
    "api-package|packages/api|API Package Service"
    "backend|apps/backend|Main Backend Application"
    "api|apps/api|Main API Server"
    "api-gateway|apps/api-gateway|API Gateway"
    "frontend|apps/frontend|Frontend Web Application"
)

TOTAL_SERVICES=${#SERVICES[@]}
DEPLOYED=0
FAILED=0

echo "📦 Deploying ${TOTAL_SERVICES} services..."
echo ""

# Deploy each service
for service_config in "${SERVICES[@]}"; do
    IFS='|' read -r service_name service_path service_desc <<< "$service_config"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Service: $service_desc"
    echo "   Name: $service_name"
    echo "   Path: $service_path"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Verify directory exists
    if [ ! -d "$service_path" ]; then
        echo "❌ Directory not found: $service_path"
        ((FAILED++))
        echo ""
        continue
    fi

    # Verify package.json exists
    if [ ! -f "$service_path/package.json" ]; then
        echo "❌ No package.json in: $service_path"
        ((FAILED++))
        echo ""
        continue
    fi

    # Change to service directory
    cd "$service_path"

    # Deploy to CloudRuntime
    echo "🚀 Deploying $service_name..."

    if cloud_runtime up --service "$service_name" --detach 2>&1; then
        echo "✅ $service_desc deployed successfully!"
        ((DEPLOYED++))
    else
        echo "❌ Failed to deploy $service_desc"
        echo "   This may mean the service doesn't exist in CloudRuntime yet."
        echo "   Create it in the CloudRuntime dashboard first, then re-run this script."
        ((FAILED++))
    fi

    # Return to root
    cd "."

    echo ""
    sleep 2
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Deployed: $DEPLOYED/$TOTAL_SERVICES"
echo "❌ Failed: $FAILED/$TOTAL_SERVICES"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All services deployed successfully!"
    echo ""
    echo "🔗 View at: https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
    exit 0
else
    echo "⚠️  Some services failed to deploy."
    echo ""
    echo "💡 Next steps:"
    echo "   1. Check CloudRuntime dashboard to see which services exist"
    echo "   2. Create missing services in CloudRuntime"
    echo "   3. Re-run this script"
    echo ""
    echo "🔗 CloudRuntime Dashboard: https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
    exit 1
fi
