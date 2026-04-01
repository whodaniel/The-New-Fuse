#!/bin/bash
set -e

PROJECT_ID="the-new-fuse-2025"
REGION="us-central1"
REPO="tnf-services"
ROOT_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse"

cd $ROOT_DIR

# Common Env Vars
DATABASE_URL="postgresql://postgres.wslydgtgindrywldatbv:pFhgQGRK38GfHWk4@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=disable"
REDIS_URL="rediss://default:gQAAAAAAAVbSAAIncDI1MTE3NWRiODViMTA0ZWFjODY4OTE4OTEyNDUzZmIwN3AyODc3NjI@key-shark-87762.upstash.io:6379"
GCS_BUCKET="the-new-fuse-2025-storage"
JWT_SECRET="the-new-fuse-2025-secret-key-change-me"
JWT_REFRESH_SECRET="the-new-fuse-2025-refresh-secret-key-change-me"

deploy_service() {
  SERVICE_NAME=$1
  DOCKERFILE=$2
  IMAGE_TAG="us-central1-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE_NAME:latest"

  echo "🚀 Building $SERVICE_NAME..."
  ln -sf $DOCKERFILE Dockerfile
  gcloud builds submit --tag $IMAGE_TAG .
  rm -f Dockerfile

  echo "🌐 Deploying $SERVICE_NAME to Cloud Run..."
  gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL,GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET=$GCS_BUCKET,JWT_SECRET=$JWT_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,NODE_ENV=production"
}

# Deploy API Gateway
deploy_service "api-gateway" "Dockerfile.api-gateway"

# Deploy Internal API
deploy_service "api-server" "Dockerfile.api-server"

echo "✅ Deployment complete!"
