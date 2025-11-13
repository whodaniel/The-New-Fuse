#!/bin/bash
set -e

echo "🚀 Deploying The New Fuse with GDesigner Integration..."

# Build core packages
echo "📦 Building packages..."
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build

# Generate Prisma client
echo "🗄️ Generating database client..."
yarn workspace @the-new-fuse/database generate

# Deploy infrastructure
echo "🛠️ Deploying infrastructure..."
docker-compose -f docker/production.yml up -d

# Run database migrations
echo "🔄 Running migrations..."
yarn workspace @the-new-fuse/database migrate

# Health check
echo "🏥 Performing health checks..."
./scripts/verify-services.sh

# Apply Kubernetes configurations
echo "🚀 Deploying Kubernetes resources..."
kubectl apply -f deployment/kubernetes/

# Start applications with new configuration
echo "✨ Starting services..."
yarn start:prod
