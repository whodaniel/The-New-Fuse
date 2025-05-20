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
npm install

# Build packages in the correct order
echo "🔨 Building packages..."
npm run build:types
npm run build:utils
npm run build:core
npm run build:ui
npm run build:feature-tracker
npm run build:feature-suggestions

# Build all applications
echo "🏗️ Building applications..."
npm run build

echo "✅ Production build complete!"
echo ""
echo "To start the production environment, run:"
echo "docker-compose up -d"
