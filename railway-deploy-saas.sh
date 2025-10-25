#!/usr/bin/env bash

# Railway Deployment Script for The New Fuse SAAS Services
# Updated to exclude desktop/browser-only applications

set -e

echo "🚀 Starting Railway deployment for The New Fuse SAAS services..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

echo "✓ Railway CLI is installed and authenticated"
echo ""

# Array of services to deploy (path:description)
services=(
    "packages/core-vector-db:Core Vector Database Service"
    "packages/relay-core:Relay Core Service"
    "apps/api:API Server"
    "apps/backend:Backend Services"
    "apps/api-gateway:API Gateway"
    "packages/api:API Package Service"
    "packages/backend:Backend Package Service"
    "apps/frontend:Frontend Application"
)

# Track deployment
deployed_count=0
failed_count=0
total_services=${#services[@]}

echo "📋 Services to deploy: ${total_services}"
echo ""

# Deploy each service
for service_entry in "${services[@]}"; do
    # Split path and description
    IFS=':' read -r service_path service_desc <<< "$service_entry"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Deploying: ${service_desc}"
    echo "   Path: ${service_path}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        echo "❌ Directory not found: ${service_path}"
        ((failed_count++))
        echo ""
        continue
    fi

    # Check if package.json exists
    if [ ! -f "$service_path/package.json" ]; then
        echo "❌ No package.json found in: ${service_path}"
        ((failed_count++))
        echo ""
        continue
    fi

    # Navigate to service directory
    cd "$service_path"

    # Check if Railway configuration exists
    if [ ! -f "railway.toml" ] && [ ! -f "nixpacks.toml" ] && [ ! -f "Dockerfile" ]; then
        echo "⚠️  No Railway config found (railway.toml, nixpacks.toml, or Dockerfile)"
        echo "   Will use Railway's auto-detection"
    fi

    # Deploy the service
    echo "🚀 Deploying..."

    if railway up --detach 2>&1; then
        echo "✅ ${service_desc} deployed successfully!"
        ((deployed_count++))
    else
        echo "❌ Failed to deploy ${service_desc}"
        ((failed_count++))
    fi

    # Go back to root directory
    cd - > /dev/null

    echo ""
done

# Print deployment summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Successful: ${deployed_count}/${total_services}"
echo "❌ Failed: ${failed_count}/${total_services}"
echo ""

if [ $failed_count -eq 0 ]; then
    echo "🎉 All SAAS services have been deployed to Railway!"
    echo ""
    echo "🔗 View your deployments at: https://railway.app/dashboard"
    exit 0
else
    echo "⚠️  Some services failed to deploy. Please check the errors above."
    echo ""
    echo "💡 Tips:"
    echo "  1. Check service logs: railway logs"
    echo "  2. Verify environment variables: railway variables"
    echo "  3. Check build output for errors"
    echo "  4. Ensure all workspace dependencies are available"
    exit 1
fi
