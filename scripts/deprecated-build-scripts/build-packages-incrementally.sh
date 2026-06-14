#!/bin/bash
set -e

echo "🚀 Building The New Fuse packages incrementally..."

# Build essential packages first
echo "📦 Building @the-new-fuse/types..."
pnpm turbo run build --filter=./packages/*

echo "✅ All essential packages built successfully!"
