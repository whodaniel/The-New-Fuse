#!/bin/bash

set -e

echo "🏗️ Building Chrome Extension (Clean)..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension"

# Clean build
echo "Cleaning previous build..."
rm -rf dist/*.js dist/*.css

# Build with existing system
echo "Building extension..."
bun run build

echo "✅ Chrome extension built successfully!"
ls -la dist/