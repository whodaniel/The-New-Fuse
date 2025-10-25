#!/bin/bash

set -e

echo "🏗️ Building Chrome Extension with Bun..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension"

# Install dependencies with pnpm
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build extension
echo "Building extension..."
cd apps/chrome-extension
pnpm run build

# Package extension
echo "Packaging extension..."
pnpm run package

echo "✅ Chrome extension built successfully!"
ls -la *.zip