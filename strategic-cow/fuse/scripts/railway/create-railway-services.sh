#!/usr/bin/env bash

# Railway Service Creation Script for The New Fuse SAAS Services
# This script creates all necessary Railway services

set -e

echo "🚀 Creating Railway services for The New Fuse SAAS..."
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

# Array of services to create (path:description)
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

# Track creation
created_count=0
failed_count=0
total_services=${#services[@]}

echo "📋 Services to create: ${total_services}"
echo ""

# Create each service
for service_entry in "${services[@]}"; do
    # Split path and description
    IFS=':' read -r service_path service_desc <<< "$service_entry"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Creating: ${service_desc}"
    echo "   Path: ${service_path}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        echo "❌ Directory not found: ${service_path}"
        ((failed_count++))
        echo ""
        continue
    fi

    # Navigate to service directory
    cd "$service_path"

    # Create the service using Railway CLI with non-interactive mode
    echo "📝 Creating service: ${service_desc}"
    
    # Create an empty service first
    if echo -e "Empty Service\n\n${service_desc}" | railway add; then
        echo "✅ ${service_desc} created successfully!"
        ((created_count++))
    else
        echo "❌ Failed to create ${service_desc}"
        ((failed_count++))
    fi

    # Go back to root directory
    cd - > /dev/null

    echo ""
done

# Print creation summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Service Creation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Created: ${created_count}/${total_services}"
echo "❌ Failed: ${failed_count}/${total_services}"
echo ""

if [ $failed_count -eq 0 ]; then
    echo "🎉 All services have been created in Railway!"
    echo ""
    echo "🔗 View your services at: https://railway.app/dashboard"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Run the deployment script: ./railway-deploy-saas.sh"
    echo "  2. Configure environment variables for each service"
    exit 0
else
    echo "⚠️  Some services failed to create. Please check the errors above."
    exit 1
fi