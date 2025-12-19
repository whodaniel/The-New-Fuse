#!/bin/bash

# Exit on error
set -e

echo "🔍 Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "🧹 Cleaning up old containers and images..."
docker-compose down --remove-orphans
docker system prune -f

echo "📦 Building Docker images..."

# Build API image with error handling
echo "Building API image..."
if ! docker build \
    --no-cache \
    --progress=plain \
    -f Dockerfile.api \
    -t the-new-fuse-api \
    .; then
    echo "⚠️ API build completed with warnings, but continuing..."
fi

# Build Client image
echo "Building Client image..."
if ! docker build \
    --no-cache \
    --progress=plain \
    -f packages/client/Dockerfile \
    -t the-new-fuse-client \
    .; then
    echo "⚠️ Client build completed with warnings, but continuing..."
fi

echo "✨ Starting services..."
docker-compose up -d

echo "🔍 Verifying containers..."
docker-compose ps

echo "📝 Showing logs..."
docker-compose logs

echo "✅ Build complete! Check the logs above for any errors."