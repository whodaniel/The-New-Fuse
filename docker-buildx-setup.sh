#!/bin/bash
# Docker Hub Cloud Builder Setup for The New Fuse
# Connects to bizsynth/tnf cloud builder for multi-platform builds

set -e

echo "🐳 Setting up Docker Hub Cloud Builder..."

# Create and connect to Docker Hub Cloud builder
echo "📦 Creating cloud builder instance..."
docker buildx create --driver cloud bizsynth/tnf --name cloud-bizsynth-tnf 2>/dev/null || echo "Builder already exists"

# Use the cloud builder as default
echo "🔧 Setting cloud builder as default..."
docker buildx use cloud-bizsynth-tnf

# Inspect the builder to verify connection
echo "🔍 Inspecting cloud builder..."
docker buildx inspect --bootstrap

echo ""
echo "✅ Docker Hub Cloud Builder setup complete!"
echo ""
echo "Builder name: cloud-bizsynth-tnf"
echo "Driver: cloud (bizsynth/tnf)"
echo ""
echo "Next steps:"
echo "  1. Build API: ./docker-build-api.sh"
echo "  2. Build Frontend: ./docker-build-frontend.sh"
echo "  3. Build All: ./docker-build-all.sh"
echo ""
