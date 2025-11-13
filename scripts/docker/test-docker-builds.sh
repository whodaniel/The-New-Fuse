#!/bin/bash
# Test Docker Builds Locally
# This script tests all Dockerfiles before deploying to Railway

set -e

echo "========================================"
echo "Testing Docker Builds"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Function to test a Docker build
test_build() {
    local service_name=$1
    local dockerfile_path=$2
    local image_name=$3

    echo "🔨 Testing build for $service_name..."
    echo "   Dockerfile: $dockerfile_path"

    if [ ! -f "$dockerfile_path" ]; then
        echo "   ❌ Dockerfile not found!"
        return 1
    fi

    echo "   Building image: $image_name"

    if docker build -f "$dockerfile_path" -t "$image_name" . > /tmp/docker-build-$service_name.log 2>&1; then
        echo "   ✅ Build successful!"

        # Check image size
        size=$(docker images "$image_name" --format "{{.Size}}")
        echo "   📦 Image size: $size"

        return 0
    else
        echo "   ❌ Build failed!"
        echo "   Check logs at: /tmp/docker-build-$service_name.log"
        tail -n 20 /tmp/docker-build-$service_name.log
        return 1
    fi
}

# Test all services
echo "Testing all service builds..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

# Frontend
if test_build "Frontend" "apps/frontend/Dockerfile" "tnf-frontend:test"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

# API Gateway
if test_build "API Gateway" "apps/api-gateway/Dockerfile" "tnf-api-gateway:test"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

# API Service
if test_build "API Service" "apps/api/Dockerfile" "tnf-api:test"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

# Backend Service
if test_build "Backend Service" "apps/backend/Dockerfile" "tnf-backend:test"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

# Summary
echo "========================================"
echo "Build Test Summary"
echo "========================================"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All builds passed!"
    echo ""
    echo "You can now:"
    echo "1. Test with docker-compose: docker-compose -f docker-compose.prod.yml up"
    echo "2. Deploy to Railway: ./deploy-to-railway.sh"
    echo ""
    exit 0
else
    echo "⚠️  Some builds failed. Please fix the issues before deploying."
    echo ""
    exit 1
fi
