#!/bin/bash
set -e

echo "🚀 Starting comprehensive build process for The New Fuse project..."
echo "=================================================="

WORKSPACE_ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Workspace root: $WORKSPACE_ROOT"

# Change to workspace root
cd "$WORKSPACE_ROOT"

# Install/update dependencies
echo "📦 Installing workspace dependencies..."
yarn install

# Build main project components with Turbo
echo "🏗️  Building main project components..."
yarn build

# Build Chrome extension
echo "🔧 Building Chrome extension..."
yarn build:chrome

# Run tests
echo "🧪 Running tests..."
yarn test
yarn test:chrome

echo "=================================================="
echo "✅ Build completed successfully!"
echo "🎯 Chrome extension is ready in: chrome-extension/dist"
echo "🚀 Main project components are built"
echo "=================================================="
