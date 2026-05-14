#!/bin/bash

# CloudRuntime Deployment Script for The New Fuse SAAS Services
# This script deploys all SAAS-related packages to CloudRuntime

set -e

echo "🚀 Starting CloudRuntime deployment for The New Fuse SAAS services..."

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

# Array of services to deploy
services=(
    "apps/api"
    "apps/backend"
    "apps/api-gateway"
    "apps/frontend"
    "apps/relay-server"
    "apps/browser-hub"
    "apps/mcp-servers"
)

# Deploy each service
for service in "${services[@]}"; do
    echo "📦 Deploying $service..."
    
    # Navigate to service directory
    cd "$service"
    
    # Create a new CloudRuntime service if it doesn't exist
    service_name=$(basename "$service")
    echo "Creating CloudRuntime service: $service_name"
    
    # Deploy the service
    cloud_runtime up --detach
    
    # Go back to root directory
    cd - > /dev/null
    
    echo "✅ $service deployed successfully!"
    echo ""
done

echo "🎉 All SAAS services have been deployed to CloudRuntime!"
echo ""
echo "📋 Deployed services:"
for service in "${services[@]}"; do
    echo "  - $(basename "$service")"
done
echo ""
echo "🔗 You can view your deployments at: https://cloud_runtime.app/dashboard"