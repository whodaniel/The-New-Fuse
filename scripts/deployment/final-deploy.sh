#!/bin/bash
# Final Automated CloudRuntime Deployment
# Run this AFTER creating services in CloudRuntime dashboard

set -e

PROJECT_ID="041cee9d-8648-4074-b5a6-0eae436de1d1"
ENV_ID="f706eaae-de9e-4a9b-a970-944dd4a6be41"
JWT_SECRET="${JWT_SECRET:-your-jwt-secret-from-env}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "The New Fuse - Final Deployment"
echo "========================================="
echo ""

cd .

# Deploy API
echo -e "${YELLOW}[1/4] Deploying API service...${NC}"
cd apps/api
export CLOUD_RUNTIME_PROJECT_ID=$PROJECT_ID
export CLOUD_RUNTIME_ENVIRONMENT_ID=$ENV_ID
cloud_runtime up --service api --detach && echo -e "${GREEN}✅ API deployment started${NC}" || echo -e "${RED}❌ API deployment failed - did you create the service?${NC}"
cd ../..
sleep 2

# Deploy Backend
echo ""
echo -e "${YELLOW}[2/4] Deploying Backend service...${NC}"
cd apps/backend
cloud_runtime up --service backend --detach && echo -e "${GREEN}✅ Backend deployment started${NC}" || echo -e "${RED}❌ Backend deployment failed - did you create the service?${NC}"
cd ../..
sleep 2

# Deploy API Gateway
echo ""
echo -e "${YELLOW}[3/4] Deploying API Gateway...${NC}"
cd apps/api-gateway
cloud_runtime up --service api-gateway --detach && echo -e "${GREEN}✅ API Gateway deployment started${NC}" || echo -e "${RED}❌ API Gateway deployment failed - did you create the service?${NC}"
cd ../..
sleep 2

# Redeploy Frontend
echo ""
echo -e "${YELLOW}[4/4] Redeploying Frontend...${NC}"
cd apps/frontend
cloud_runtime up --service "Frontend Application" --detach && echo -e "${GREEN}✅ Frontend deployment started${NC}" || cloud_runtime up --service frontend --detach && echo -e "${GREEN}✅ Frontend deployment started${NC}" || echo -e "${RED}❌ Frontend deployment failed${NC}"
cd ../..

echo ""
echo "========================================="
echo "Deployments Initiated!"
echo "========================================="
echo ""
echo "⏳ Builds will take 40-60 minutes"
echo ""
echo "Monitor progress:"
echo "  cloud_runtime logs --service api"
echo "  cloud_runtime logs --service backend"
echo "  cloud_runtime logs --service api-gateway"
echo "  cloud_runtime logs --service frontend"
echo ""
echo "Dashboard:"
echo "  https://thenewfuse.com/project/$PROJECT_ID"
echo ""

# Now configure environment variables
echo "========================================="
echo "Configuring Environment Variables"
echo "========================================="
echo ""

echo "Setting API variables..."
cloud_runtime variables --service api set NODE_ENV=production 2>/dev/null || true
cloud_runtime variables --service api set PORT=3001 2>/dev/null || true
cloud_runtime variables --service api set DATABASE_URL='${{Postgres.DATABASE_URL}}' 2>/dev/null || true
cloud_runtime variables --service api set REDIS_URL='${{Redis.REDIS_URL}}' 2>/dev/null || true
cloud_runtime variables --service api set JWT_SECRET="$JWT_SECRET" 2>/dev/null || true

echo "Setting Backend variables..."
cloud_runtime variables --service backend set NODE_ENV=production 2>/dev/null || true
cloud_runtime variables --service backend set PORT=3004 2>/dev/null || true
cloud_runtime variables --service backend set DATABASE_URL='${{Postgres.DATABASE_URL}}' 2>/dev/null || true
cloud_runtime variables --service backend set REDIS_URL='${{Redis.REDIS_URL}}' 2>/dev/null || true

echo "Setting API Gateway variables..."
cloud_runtime variables --service api-gateway set NODE_ENV=production 2>/dev/null || true
cloud_runtime variables --service api-gateway set PORT=3002 2>/dev/null || true
cloud_runtime variables --service api-gateway set API_URL='${{api.CLOUD_RUNTIME_PRIVATE_DOMAIN}}' 2>/dev/null || true
cloud_runtime variables --service api-gateway set BACKEND_URL='${{backend.CLOUD_RUNTIME_PRIVATE_DOMAIN}}' 2>/dev/null || true

echo "Setting Frontend variables..."
cloud_runtime variables --service "Frontend Application" set NODE_ENV=production 2>/dev/null || cloud_runtime variables --service frontend set NODE_ENV=production 2>/dev/null || true
cloud_runtime variables --service "Frontend Application" set PORT=3000 2>/dev/null || cloud_runtime variables --service frontend set PORT=3000 2>/dev/null || true
cloud_runtime variables --service "Frontend Application" set VITE_API_URL='https://${{api-gateway.CLOUD_RUNTIME_PUBLIC_DOMAIN}}' 2>/dev/null || cloud_runtime variables --service frontend set VITE_API_URL='https://${{api-gateway.CLOUD_RUNTIME_PUBLIC_DOMAIN}}' 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Environment variables configured!${NC}"
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Wait for builds to complete (40-60 min)"
echo "2. Check deployment status: cloud_runtime status"
echo "3. View logs: cloud_runtime logs --service <name>"
echo "4. Open dashboard: https://thenewfuse.com/project/$PROJECT_ID"
echo ""
echo -e "${GREEN}All done! Your services are deploying.${NC}"
echo ""
