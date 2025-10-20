#!/bin/bash

# Minimal build script for The New Fuse
# Only builds essential components

set -e

echo "🔨 Starting minimal build..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build API
echo "🔧 Building API..."
cd apps/api
pnpm build
cd ../..

# Build frontend
echo "🎨 Building frontend..."
cd apps/frontend
pnpm build
cd ../..

echo "✅ Minimal build completed!"
echo "📁 Built files:"
echo "   - API: apps/api/dist/"
echo "   - Frontend: apps/frontend/dist/"
