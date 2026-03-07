#!/usr/bin/env bash
#
# Railway Auto-Create and Deploy Script
# This version lets Railway auto-create services
#
set -e

echo "🚀 Railway Auto-Deploy - The New Fuse"
echo "======================================"
echo ""

# Verify Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed"
    exit 1
fi

# Verify authentication
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    exit 1
fi

echo "✅ Railway CLI ready"
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

    # Try to deploy - Railway will auto-create service if needed
    echo "🚀 Deploying..."

    # Use railway up without --service flag to auto-create
    if railway up --detach 2>&1; then
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
