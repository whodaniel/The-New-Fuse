#!/usr/bin/env bash

# Deploy remaining package services to Railway
# This script creates the services first, then deploys them

set -e

echo "🚀 Deploying remaining package services to Railway..."
echo ""

# Check prerequisites
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    exit 1
fi

# Package services to deploy
services=(
    "core-vector-db:packages/core-vector-db:Core Vector Database Service"
    "relay-core:packages/relay-core:Relay Core Service"
    "api-package:packages/api:API Package Service"
    "backend-package:packages/backend:Backend Package Service"
)

deployed=0
failed=0

for service_entry in "${services[@]}"; do
    IFS=':' read -r service_name service_path service_desc <<< "$service_entry"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 ${service_desc}"
    echo "   Service Name: ${service_name}"
    echo "   Path: ${service_path}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$service_path"

    echo "🔧 Creating service: ${service_name}"
    if railway service create "$service_name" 2>&1 | grep -q "Service created"; then
        echo "✅ Service created successfully"
    else
        echo "ℹ️  Service may already exist, proceeding with deployment..."
    fi

    echo "🚀 Deploying to ${service_name}..."
    if railway up --service "$service_name" --detach 2>&1; then
        echo "✅ ${service_desc} deployed successfully!"
        ((deployed++))
    else
        echo "❌ Failed to deploy ${service_desc}"
        ((failed++))
    fi

    cd - > /dev/null
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Package Services Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployed: ${deployed}/4"
echo "❌ Failed: ${failed}/4"
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 All package services deployed!"
    exit 0
else
    echo "⚠️  Some services failed. Check logs above."
    exit 1
fi
