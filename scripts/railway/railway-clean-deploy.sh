#!/usr/bin/env bash
#
# Railway Clean Deployment Script
# Deploys all SAAS services to Railway in correct order
#
set -e

echo "🚀 Railway Clean Deployment - The New Fuse"
echo "=========================================="
echo ""

# Verify Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed. Install with: npm install -g @railway/cli"
    exit 1
fi

# Verify authentication
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"
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

    # Deploy to Railway
    echo "🚀 Deploying $service_name..."

    if railway up --service "$service_name" --detach 2>&1; then
        echo "✅ $service_desc deployed successfully!"
        ((DEPLOYED++))
    else
        echo "❌ Failed to deploy $service_desc"
        echo "   This may mean the service doesn't exist in Railway yet."
        echo "   Create it in the Railway dashboard first, then re-run this script."
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
    echo "🔗 View at: https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
    exit 0
else
    echo "⚠️  Some services failed to deploy."
    echo ""
    echo "💡 Next steps:"
    echo "   1. Check Railway dashboard to see which services exist"
    echo "   2. Create missing services in Railway"
    echo "   3. Re-run this script"
    echo ""
    echo "🔗 Railway Dashboard: https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
    exit 1
fi
