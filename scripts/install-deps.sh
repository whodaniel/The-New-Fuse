#!/bin/bash

# Install dependencies script for The New Fuse
# Handles workspace dependency installation

set -e

echo "📦 Installing dependencies for The New Fuse..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install root dependencies
echo "🔧 Installing root dependencies..."
pnpm install

# Install workspace dependencies
echo "🏗️ Installing workspace dependencies..."
pnpm install --recursive

# Build packages
echo "🏗️ Building packages..."
pnpm run build

echo "✅ Dependencies installed successfully!"
echo "🎯 Next steps:"
echo "   - Run: pnpm dev (for development)"
echo "   - Run: pnpm build (for production build)"
