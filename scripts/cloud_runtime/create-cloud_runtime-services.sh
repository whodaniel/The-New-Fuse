#!/usr/bin/env bash

# CloudRuntime Service Creation Script for The New Fuse SAAS Services
# This script creates all necessary CloudRuntime services

set -e

echo "🚀 Creating CloudRuntime services for The New Fuse SAAS..."
echo ""

# Check if CloudRuntime CLI is installed
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI is not installed. Please install it first:"
    echo "npm install -g @cloud_runtime/cli"
    exit 1
fi

# Check if user is logged in to CloudRuntime
if ! cloud_runtime whoami &> /dev/null; then
    echo "❌ Not logged in to CloudRuntime. Please login first:"
    echo "cloud_runtime login"
    exit 1
fi

echo "✓ CloudRuntime CLI is installed and authenticated"
echo ""

# Link to the TNF project
echo "🔗 Linking to TNF project..."
cloud_runtime link --project TNF --environment production

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

    # Create the service using CloudRuntime CLI with non-interactive mode
    echo "📝 Creating service: ${service_desc}"
    
    # Create an empty service first
    if echo -e "Empty Service\n\n${service_desc}" | cloud_runtime add; then
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
    echo "🎉 All services have been created in CloudRuntime!"
    echo ""
    echo "🔗 View your services at: https://cloud_runtime.app/dashboard"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Run the deployment script: ./cloud_runtime-deploy-saas.sh"
    echo "  2. Configure environment variables for each service"
    exit 0
else
    echo "⚠️  Some services failed to create. Please check the errors above."
    exit 1
fi