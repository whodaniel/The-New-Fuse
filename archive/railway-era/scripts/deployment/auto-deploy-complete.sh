#!/bin/bash
# Complete automated deployment to CloudRuntime
# This script will deploy and configure all services

set -e

PROJECT_ID="041cee9d-8648-4074-b5a6-0eae436de1d1"
ENV_ID="f706eaae-de9e-4a9b-a970-944dd4a6be41"
JWT_SECRET="${JWT_SECRET:-your-jwt-secret-from-env}"

echo "========================================="
echo "Automated CloudRuntime Deployment"
echo "========================================="
echo ""

cd .

# Deploy API
echo "Deploying API service..."
cd apps/api
export CLOUD_RUNTIME_PROJECT_ID=$PROJECT_ID
export CLOUD_RUNTIME_ENVIRONMENT_ID=$ENV_ID
cloud_runtime up --service api --detach || cloud_runtime up --detach &
API_PID=$!
cd ../..

# Deploy Backend
echo "Deploying Backend service..."
cd apps/backend
export CLOUD_RUNTIME_PROJECT_ID=$PROJECT_ID
export CLOUD_RUNTIME_ENVIRONMENT_ID=$ENV_ID
cloud_runtime up --service backend --detach || cloud_runtime up --detach &
BACKEND_PID=$!
cd ../..

# Deploy API Gateway
echo "Deploying API Gateway service..."
cd apps/api-gateway
export CLOUD_RUNTIME_PROJECT_ID=$PROJECT_ID
export CLOUD_RUNTIME_ENVIRONMENT_ID=$ENV_ID
cloud_runtime up --service api-gateway --detach || cloud_runtime up --detach &
GATEWAY_PID=$!
cd ../..

# Deploy Frontend
echo "Deploying Frontend service..."
cd apps/frontend
export CLOUD_RUNTIME_PROJECT_ID=$PROJECT_ID
export CLOUD_RUNTIME_ENVIRONMENT_ID=$ENV_ID
cloud_runtime up --service frontend --detach || cloud_runtime up --service "Frontend Application" --detach &
FRONTEND_PID=$!
cd ../..

echo ""
echo "All deployments initiated!"
echo "Builds will take 40-60 minutes."
echo ""
echo "Monitor with:"
echo "  cloud_runtime logs --service api"
echo "  cloud_runtime logs --service backend"
echo "  cloud_runtime logs --service api-gateway"
echo "  cloud_runtime logs --service frontend"
echo ""
