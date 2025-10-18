#!/bin/bash
set -e

echo "🚀 Building The New Fuse project (all components)..."

# Step 1: Fix TypeScript declaration errors
echo "🔧 Fixing TypeScript declaration errors..."
node fix-declarations.mjs

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Step 3: Build packages in the correct order
echo "🔨 Building essential packages..."
pnpm run build:types
pnpm run build:utils
pnpm run build:core
pnpm run build:ui

# Step 4: Build applications
echo "🏗️ Building applications..."
pnpm run build

# Step 5: Build VS Code extension
echo "🧩 Building VS Code extension..."
cd packages/vscode-extension
pnpm install
pnpm run build
pnpm run package
cd ../..

# Step 6: Build Chrome extension
echo "🌐 Building Chrome extension..."
cd packages/chrome-extension
pnpm install
pnpm run build
cd ../..

# Step 7: Build Docker images
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.yml build

echo "✅ All components built successfully!"
echo ""
echo "To run the development environment:"
echo "./run-dev-docker.sh"
echo ""
echo "To run the production environment:"
echo "./run-prod-docker.sh"
