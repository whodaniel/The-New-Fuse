#!/bin/bash
# The New Fuse - CloudRuntime Deployment Script
# This script helps you deploy services to CloudRuntime

set -e

echo "========================================"
echo "The New Fuse - CloudRuntime Deployment"
echo "========================================"
echo ""

# Check if CloudRuntime CLI is installed
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI not found!"
    echo "Install it with: npm install -g @cloud_runtime/cli"
    exit 1
fi

echo "✅ CloudRuntime CLI found"
echo ""

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_path=$2

    echo "🚀 Deploying $service_name..."
    echo "   Path: $service_path"

    # Check if Dockerfile exists
    if [ ! -f "$service_path/Dockerfile" ]; then
        echo "   ⚠️  Dockerfile not found at $service_path/Dockerfile"
        echo "   Skipping $service_name"
        return 1
    fi

    # Check if cloud_runtime.toml exists
    if [ ! -f "$service_path/cloud_runtime.toml" ]; then
        echo "   ⚠️  cloud_runtime.toml not found at $service_path/cloud_runtime.toml"
        echo "   Skipping $service_name"
        return 1
    fi

    echo "   ✅ Configuration files found"
    echo "   📦 Building and deploying..."

    # Deploy using CloudRuntime CLI
    cd "$service_path"
    cloud_runtime up --detach || {
        echo "   ❌ Deployment failed for $service_name"
        cd - > /dev/null
        return 1
    }
    cd - > /dev/null

    echo "   ✅ $service_name deployed successfully"
    echo ""
    return 0
}

# Main deployment flow
echo "Select deployment option:"
echo "1. Deploy all services"
echo "2. Deploy Frontend only"
echo "3. Deploy API Gateway only"
echo "4. Deploy API Service only"
echo "5. Deploy Backend Service only"
echo "6. Deploy specific services (interactive)"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying all services..."
        echo ""
        deploy_service "Frontend" "apps/frontend"
        deploy_service "API Gateway" "apps/api-gateway"
        deploy_service "API Service" "apps/api"
        deploy_service "Backend Service" "apps/backend"
        ;;
    2)
        deploy_service "Frontend" "apps/frontend"
        ;;
    3)
        deploy_service "API Gateway" "apps/api-gateway"
        ;;
    4)
        deploy_service "API Service" "apps/api"
        ;;
    5)
        deploy_service "Backend Service" "apps/backend"
        ;;
    6)
        echo ""
        echo "Select services to deploy (space-separated numbers):"
        echo "1. Frontend"
        echo "2. API Gateway"
        echo "3. API Service"
        echo "4. Backend Service"
        echo ""
        read -p "Enter services (e.g., '1 3 4'): " services

        for service in $services; do
            case $service in
                1) deploy_service "Frontend" "apps/frontend" ;;
                2) deploy_service "API Gateway" "apps/api-gateway" ;;
                3) deploy_service "API Service" "apps/api" ;;
                4) deploy_service "Backend Service" "apps/backend" ;;
                *) echo "Invalid service number: $service" ;;
            esac
        done
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Check service status: cloud_runtime status"
echo "2. View logs: cloud_runtime logs --service <service-name>"
echo "3. Open CloudRuntime Dashboard: cloud_runtime open"
echo ""
echo "Don't forget to configure environment variables in CloudRuntime Dashboard!"
echo ""
