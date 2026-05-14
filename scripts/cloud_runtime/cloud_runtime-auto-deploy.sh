#!/usr/bin/env bash
#
# CloudRuntime Auto-Create and Deploy Script
# This version lets CloudRuntime auto-create services
#
set -e

echo "🚀 CloudRuntime Auto-Deploy - The New Fuse"
echo "======================================"
echo ""

# Verify CloudRuntime CLI
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI not installed"
    exit 1
fi

# Verify authentication
if ! cloud_runtime whoami &> /dev/null; then
    echo "❌ Not logged in to CloudRuntime"
    exit 1
fi

echo "✅ CloudRuntime CLI ready"
echo ""

ROOT_DIR="."

# Service paths in deployment order
declare -a SERVICE_PATHS=(
    "packages/core-vector-db"
    "packages/relay-core"
    "packages/backend"
    "packages/api"
    "apps/backend"
    "apps/api"
    "apps/api-gateway"
    "apps/frontend"
)

TOTAL=${#SERVICE_PATHS[@]}
DEPLOYED=0
FAILED=0

echo "📦 Deploying ${TOTAL} services..."
echo ""

for service_path in "${SERVICE_PATHS[@]}"; do
    service_name=$(basename "$service_path")

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying: $service_name"
    echo "   Path: $service_path"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Change to service directory
    if [ ! -d "$ROOT_DIR/$service_path" ]; then
        echo "❌ Directory not found: $service_path"
        ((FAILED++))
        echo ""
        continue
    fi

    cd "$ROOT_DIR/$service_path"

    # Try to deploy - CloudRuntime will auto-create service if needed
    echo "🚀 Deploying..."

    # Use cloud_runtime up without --service flag to auto-create
    if cloud_runtime up --detach 2>&1; then
        echo "✅ $service_name deployed!"
        ((DEPLOYED++))
    else
        echo "❌ Failed to deploy $service_name"
        ((FAILED++))
    fi

    cd "$ROOT_DIR"
    echo ""
    sleep 2
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Deployed: $DEPLOYED/$TOTAL"
echo "❌ Failed: $FAILED/$TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All services deployed!"
    exit 0
else
    echo "⚠️  Some services failed"
    exit 1
fi
