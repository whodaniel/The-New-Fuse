#!/bin/bash
# Build all The New Fuse services using Docker Hub Cloud
# Builds API and Frontend in parallel for faster deployment

set -e

TAG="${1:-latest}"

echo "🚀 Building all The New Fuse services..."
echo "  Tag: ${TAG}"
echo ""

# Ensure cloud builder is active
docker buildx use cloud-bizsynth-tnf 2>/dev/null || {
    echo "⚠️  Cloud builder not found. Running setup..."
    ./docker-buildx-setup.sh
}

echo "📦 Building services in parallel..."
echo ""

# Build API and Frontend in parallel
./docker-build-api.sh ${TAG} &
API_PID=$!

./docker-build-frontend.sh ${TAG} &
FRONTEND_PID=$!

# Wait for both builds to complete
echo "⏳ Waiting for builds to complete..."
wait $API_PID
API_STATUS=$?

wait $FRONTEND_PID
FRONTEND_STATUS=$?

echo ""
if [ $API_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo "✅ All builds completed successfully!"
    echo ""
    echo "Images:"
    echo "  - bizsynth/the-new-fuse-api:${TAG}"
    echo "  - bizsynth/the-new-fuse-frontend:${TAG}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy to Railway: railway up"
    echo "  2. Or use docker-compose: docker-compose up"
    echo ""
else
    echo "❌ Build failed!"
    echo "  API status: $API_STATUS"
    echo "  Frontend status: $FRONTEND_STATUS"
    exit 1
fi
