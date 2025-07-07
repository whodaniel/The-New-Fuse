#!/bin/bash

set -e

echo "🏗️ Building Chrome Extension with Bun..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension"

# Install dependencies with bun
echo "Installing dependencies..."
bun install

# Build extension
echo "Building extension..."
bun run build

# Package extension
echo "Packaging extension..."
bun run package

echo "✅ Chrome extension built successfully!"
ls -la *.zip