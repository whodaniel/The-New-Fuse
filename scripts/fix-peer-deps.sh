#!/bin/bash

# Fix peer dependencies script
# Resolves common peer dependency issues

set -e

echo "🔗 Fixing peer dependencies..."

# Remove existing node_modules
echo "🧹 Cleaning existing installations..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -f pnpm-lock.yaml

# Install with peer dependency resolution
echo "📦 Installing with peer dependency resolution..."
pnpm install --shamefully-hoist

# Fix specific peer dependency issues
echo "🔧 Fixing specific peer dependencies..."

# React peer dependencies
pnpm add react@^18.0.0 react-dom@^18.0.0 --save-peer

# TypeScript peer dependencies
pnpm add typescript@^5.0.0 --save-dev

# ESLint peer dependencies
pnpm add eslint@^8.0.0 --save-dev

echo "✅ Peer dependencies fixed!"
echo "🎯 Run: pnpm dev to start development"