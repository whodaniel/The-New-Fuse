#!/bin/bash

# Railway Deployment Script for The New Fuse SAAS Services
# This script deploys all SAAS-related packages to Railway

set -e

echo "🚀 Starting Railway deployment for The New Fuse SAAS services..."

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
    
    # Create a new Railway service if it doesn't exist
    service_name=$(basename "$service")
    echo "Creating Railway service: $service_name"
    
    # Deploy the service
    railway up --detach
    
    # Go back to root directory
    cd - > /dev/null
    
    echo "✅ $service deployed successfully!"
    echo ""
done

echo "🎉 All SAAS services have been deployed to Railway!"
echo ""
echo "📋 Deployed services:"
for service in "${services[@]}"; do
    echo "  - $(basename "$service")"
done
echo ""
echo "🔗 You can view your deployments at: https://railway.app/dashboard"