#!/bin/bash
# Deploy The New Fuse services to CloudRuntime
# Run this AFTER creating empty services in CloudRuntime dashboard

set -e

echo "========================================="
echo "The New Fuse - CloudRuntime Service Deployment"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="."

# Check CloudRuntime CLI
if ! command -v cloud_runtime &> /dev/null; then
    echo -e "${RED}❌ CloudRuntime CLI not found${NC}"
    echo "Install: npm install -g @cloud_runtime/cli"
    exit 1
fi

echo -e "${GREEN}✅ CloudRuntime CLI found${NC}"
echo ""

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_path=$2

    echo ""
    echo "=========================================  "
    echo -e "${YELLOW}Deploying: $service_name${NC}"
    echo "========================================="
    echo "Path: $service_path"

    # Navigate to service directory
    cd "$PROJECT_ROOT/$service_path"

    # Link to the service
    echo "Linking to CloudRuntime service: $service_name..."
    if ! cloud_runtime link --service "$service_name" 2>&1; then
        echo -e "${RED}❌ Failed to link to service: $service_name${NC}"
        echo "Make sure the service exists in CloudRuntime dashboard:"
        echo "https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
        return 1
    fi

    echo -e "${GREEN}✅ Linked to $service_name${NC}"
    echo ""

    # Deploy
    echo "📦 Deploying $service_name..."
    echo "This will take 10-15 minutes for first build..."
    echo ""

    if cloud_runtime up --detach 2>&1; then
        echo -e "${GREEN}✅ $service_name deployment started!${NC}"
        echo "Watch logs: cloud_runtime logs --service $service_name"
        return 0
    else
        echo -e "${RED}❌ Deployment failed for $service_name${NC}"
        return 1
    fi
}

# Start deployments
echo "Starting deployment of all services..."
echo "Make sure you've created these services in CloudRuntime dashboard:"
echo "- api"
echo "- backend"
echo "- api-gateway"
echo "- frontend"
echo ""
read -p "Have you created all services in CloudRuntime dashboard? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Please create services first:${NC}"
    echo "1. Visit: https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
    echo "2. Click '+ New' → 'Empty Service'"
    echo "3. Create: api, backend, api-gateway, frontend"
    echo "4. Run this script again"
    exit 0
fi

echo ""

# Deploy each service
services_deployed=0
services_failed=0

if deploy_service "api" "apps/api"; then
    ((services_deployed++))
else
    ((services_failed++))
fi

if deploy_service "backend" "apps/backend"; then
    ((services_deployed++))
else
    ((services_failed++))
fi

if deploy_service "api-gateway" "apps/api-gateway"; then
    ((services_deployed++))
else
    ((services_failed++))
fi

if deploy_service "frontend" "apps/frontend"; then
    ((services_deployed++))
else
    ((services_failed++))
fi

# Summary
echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo -e "${GREEN}✅ Deployed: $services_deployed/4${NC}"
if [ $services_failed -gt 0 ]; then
    echo -e "${RED}❌ Failed: $services_failed/4${NC}"
fi
echo ""

if [ $services_deployed -gt 0 ]; then
    echo "🎉 Deployments started successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor builds:"
    echo "   cloud_runtime logs --service api"
    echo "   cloud_runtime logs --service backend"
    echo "   cloud_runtime logs --service api-gateway"
    echo "   cloud_runtime logs --service frontend"
    echo ""
    echo "2. Configure environment variables (see FINAL_DEPLOYMENT_STEPS.md)"
    echo ""
    echo "3. Check status:"
    echo "   cloud_runtime status"
    echo ""
    echo "Dashboard:"
    echo "https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
fi

if [ $services_failed -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some deployments failed${NC}"
    echo "Check that services exist in CloudRuntime dashboard"
    echo "Service names must match exactly: api, backend, api-gateway, frontend"
fi

echo ""
