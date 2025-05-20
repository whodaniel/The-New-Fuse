#!/bin/bash
set -e

echo "🚀 Building The New Fuse packages incrementally..."

# Build essential packages first
echo "📦 Building @the-new-fuse/types..."
yarn workspace @the-new-fuse/types build || yarn build:types

echo "📦 Building @the-new-fuse/utils..."
yarn workspace @the-new-fuse/utils build || yarn build:utils

echo "📦 Building @the-new-fuse/core..."
yarn workspace @the-new-fuse/core build || yarn build:core

echo "📦 Building @the-new-fuse/ui..."
yarn workspace @the-new-fuse/ui build || yarn build:ui

echo "📦 Building @the-new-fuse/feature-tracker..."
yarn workspace @the-new-fuse/feature-tracker build || yarn build:feature-tracker

echo "📦 Building @the-new-fuse/feature-suggestions..."
yarn workspace @the-new-fuse/feature-suggestions build || yarn build:feature-suggestions

echo "✅ All essential packages built successfully!"
