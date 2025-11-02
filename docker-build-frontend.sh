#!/bin/bash
# Build The New Fuse Frontend using Docker Hub Cloud
# Supports multi-platform builds (linux/amd64, linux/arm64)

set -e

# Configuration
DOCKER_HUB_USER="bizsynth"
IMAGE_NAME="the-new-fuse-frontend"
TAG="${1:-latest}"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 Building The New Fuse Frontend..."
echo "  Image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"
echo "  Platforms: ${PLATFORMS}"
echo ""

# Ensure cloud builder is active
docker buildx use cloud-bizsynth-tnf 2>/dev/null || {
    echo "⚠️  Cloud builder not found. Running setup..."
    ./docker-buildx-setup.sh
}

# Build and push to Docker Hub
echo "📦 Building with Docker Hub Cloud..."
docker buildx build \
    --builder cloud-bizsynth-tnf \
    --platform ${PLATFORMS} \
    --file apps/frontend/Dockerfile.production \
    --tag ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG} \
    --tag ${DOCKER_HUB_USER}/${IMAGE_NAME}:$(git rev-parse --short HEAD) \
    --push \
    --progress=plain \
    .

echo ""
echo "✅ Frontend build complete!"
echo "  Image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"
echo "  Commit: $(git rev-parse --short HEAD)"
echo ""
echo "Pull with: docker pull ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"
echo ""
