#!/bin/bash
set -e

echo "🚀 Deploying The New Fuse to production..."

# Validate environment
if [ -z "$PRODUCTION_ENV" ]; then
    echo "❌ Production environment not set. Aborting."
    exit 1
fi

# Build production assets
echo "📦 Building production assets..."
yarn clean
yarn install --frozen-lockfile
yarn workspaces foreach -pt run build

# Generate fresh Drizzle client
echo "🗄️ Generating database client..."
yarn workspace @the-new-fuse/database generate

# Run database migrations
echo "🔄 Running database migrations..."
yarn workspace @the-new-fuse/database migrate:deploy

# Build and push Docker images
echo "🐳 Building and pushing Docker images..."
docker-compose -f docker/production.yml build
docker-compose -f docker/production.yml push

# Deploy to production
echo "📤 Deploying to production servers..."
kubectl apply -f deploy/k8s/configmaps/
kubectl apply -f deploy/k8s/secrets/
kubectl apply -f deploy/k8s/deployments/

# Scale services
echo "⚖️ Scaling services..."
kubectl scale deployment fuse-api --replicas=3
kubectl scale deployment fuse-frontend --replicas=3
kubectl scale deployment fuse-backend --replicas=3

# Verify deployment
echo "✅ Verifying deployment..."
kubectl rollout status deployment/fuse-api
kubectl rollout status deployment/fuse-frontend
kubectl rollout status deployment/fuse-backend

echo "🎉 Production deployment complete!"