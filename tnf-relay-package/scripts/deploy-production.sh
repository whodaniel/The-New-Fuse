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
bun clean
pnpm install --frozen-lockfile
bun workspaces foreach -pt run build

# Generate fresh Prisma client
echo "🗄️ Generating database client..."
bun --filter @the-new-fuse/database run generate

# Run database migrations
echo "🔄 Running database migrations..."
bun --filter @the-new-fuse/database run migrate:deploy

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