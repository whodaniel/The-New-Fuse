#!/bin/bash
set -e

echo "🚀 Building The New Fuse for production..."

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf dist
find . -name "dist" -type d -exec rm -rf {} +
find . -name ".turbo" -type d -exec rm -rf {} +

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages in the correct order
echo "🔨 Building packages..."
pnpm run build:types
pnpm run build:utils
pnpm run build:core
pnpm run build:ui
pnpm run build:feature-tracker
pnpm run build:feature-suggestions

# Build all applications
echo "🏗️ Building applications..."
pnpm run build

echo "✅ Production build complete!"
echo ""
echo "To start the production environment, run:"
echo "docker-compose up -d"
