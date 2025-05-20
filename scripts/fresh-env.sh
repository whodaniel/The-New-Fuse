#!/bin/bash
set -e

echo "🧹 Preparing fresh environment..."

# Stop all existing services
./scripts/stop-all.sh

# Clean Docker
echo "🐳 Cleaning Docker environment..."
docker-compose down --remove-orphans --volumes
docker system prune -f

# Clean yarn cache and node_modules
echo "📦 Cleaning package dependencies..."
yarn cache clean
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf apps/*/dist
rm -rf packages/*/dist
rm -rf apps/*/.next
rm -rf apps/*/build

# Reset environment files
echo "⚙️ Resetting environment files..."
cp .env.example .env
cp apps/api/.env.example apps/api/.env 2>/dev/null || true
cp apps/frontend/.env.example apps/frontend/.env 2>/dev/null || true
cp apps/backend/.env.example apps/backend/.env 2>/dev/null || true

echo "✨ Fresh environment prepared!"