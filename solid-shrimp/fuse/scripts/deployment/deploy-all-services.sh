#!/bin/bash
# Deploy All Services to Railway
# This script deploys all The New Fuse services to Railway

set -e

echo "========================================="
echo "The New Fuse - Complete Railway Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"

# Check authentication
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Railway${NC}"
echo ""

# Project and environment IDs
PROJECT_ID="041cee9d-8648-4074-b5a6-0eae436de1d1"
ENVIRONMENT_ID="f706eaae-de9e-4a9b-a970-944dd4a6be41"

echo "Project ID: $PROJECT_ID"
echo "Environment ID: $ENVIRONMENT_ID"
echo ""

# Services to deploy
declare -A SERVICES
SERVICES=(
    ["api"]="apps/api"
    ["backend"]="apps/backend"
    ["api-gateway"]="apps/api-gateway"
    ["frontend"]="apps/frontend"
)

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_path=$2

    echo ""
    echo "========================================="
    echo "Deploying: $service_name"
    echo "Path: $service_path"
    echo "========================================="

    # Check if Dockerfile exists
    if [ ! -f "$service_path/Dockerfile" ]; then
        echo -e "${RED}❌ Dockerfile not found at $service_path/Dockerfile${NC}"
        return 1
    fi

    # Check if railway.toml exists
    if [ ! -f "$service_path/railway.toml" ]; then
        echo -e "${YELLOW}⚠️  railway.toml not found, will use default configuration${NC}"
    else
        echo -e "${GREEN}✅ Found railway.toml${NC}"
    fi

    echo ""
    echo "📦 Deploying $service_name to Railway..."
    echo "   This may take 10-15 minutes for the first deployment..."
    echo ""

    # Deploy from service directory
    cd "$service_path"

    # Try to deploy with service name
    if RAILWAY_PROJECT_ID="$PROJECT_ID" RAILWAY_ENVIRONMENT_ID="$ENVIRONMENT_ID" RAILWAY_SERVICE="$service_name" railway up --detach 2>&1; then
        echo -e "${GREEN}✅ $service_name deployment started successfully!${NC}"
        cd ../..
        return 0
    else
        echo -e "${YELLOW}⚠️  Standard deployment failed, trying alternative method...${NC}"

        # Alternative: deploy from root with explicit Dockerfile
        cd ../..
        if RAILWAY_PROJECT_ID="$PROJECT_ID" RAILWAY_ENVIRONMENT_ID="$ENVIRONMENT_ID" railway up --detach --service "$service_name" 2>&1; then
            echo -e "${GREEN}✅ $service_name deployment started successfully!${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to deploy $service_name${NC}"
            echo -e "${YELLOW}This service may need to be created manually in the Railway dashboard first.${NC}"
            return 1
        fi
    fi
}

# Deploy all services
echo "Starting deployment of all services..."
echo ""

deployed_count=0
failed_count=0

for service in "${!SERVICES[@]}"; do
    if deploy_service "$service" "${SERVICES[$service]}"; then
        ((deployed_count++))
    else
        ((failed_count++))
    fi
    echo ""
done

# Summary
echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo -e "${GREEN}✅ Successfully deployed: $deployed_count${NC}"
echo -e "${RED}❌ Failed deployments: $failed_count${NC}"
echo ""

if [ $failed_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some services failed to deploy.${NC}"
    echo ""
    echo "To create services manually:"
    echo "1. Visit: https://railway.com/project/$PROJECT_ID"
    echo "2. Click '+ New' → 'Empty Service'"
    echo "3. Name the service (api, backend, api-gateway, frontend)"
    echo "4. Run this script again"
    echo ""
fi

echo "Next steps:"
echo "1. Check deployment status: railway logs"
echo "2. Configure environment variables in Railway Dashboard"
echo "3. Monitor builds at: https://railway.com/project/$PROJECT_ID"
echo ""
echo "Dashboard URL: https://railway.com/project/$PROJECT_ID?environmentId=$ENVIRONMENT_ID"
echo ""
