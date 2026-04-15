#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse project..."

# Clean up any previous installations
echo "🧹 Cleaning up previous installations..."
rm -rf node_modules
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +
find . -name ".turbo" -type d -exec rm -rf {} +
find . -name "yarn.lock" -type f -delete
find . -name "package-lock.json" -type f -delete

# Enable Yarn Berry
echo "📦 Setting up Yarn..."
corepack enable
yarn set version berry
yarn config set nodeLinker node-modules

# Install dependencies using Yarn
echo "📦 Installing root dependencies..."
yarn install

# Build packages in the correct order
echo "🔨 Building essential packages..."
yarn build:types
yarn build:utils
yarn build:core
yarn build:ui

echo "✅ Setup complete! You can now run the development server with:"
echo "   yarn dev"
