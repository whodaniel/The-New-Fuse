#!/usr/bin/env bash

# Railway Deployment Script for Existing Services
# This script deploys only to services that already exist in Railway

set -e

echo "🚀 Starting Railway deployment for existing services..."
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

# Link to the TNF project
echo "🔗 Linking to TNF project..."
railway link --project TNF --environment production

# Array of existing services to deploy (path:description)
existing_services=(
    "packages/prompt-templating:Prompt Templating Service"
)

# Track deployment
deployed_count=0
failed_count=0
total_services=${#existing_services[@]}

echo "📋 Existing services to deploy: ${total_services}"
echo ""

# Deploy each existing service
for service_entry in "${existing_services[@]}"; do
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
    echo "🎉 All existing services have been deployed to Railway!"
    echo ""
    echo "🔗 View your deployments at: https://railway.app/dashboard"
    echo ""
    echo "💡 To create additional services:"
    echo "  1. Navigate to the service directory (e.g., cd packages/core-vector-db)"
    echo "  2. Run: railway add"
    echo "  3. Select 'Empty Service'"
    echo "  4. Provide a descriptive service name"
    echo "  5. Then run: railway up --detach"
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