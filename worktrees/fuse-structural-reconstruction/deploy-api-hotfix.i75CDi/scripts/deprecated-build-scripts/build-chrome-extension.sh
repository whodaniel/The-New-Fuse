#!/bin/bash
set -e

echo "🚀 Building The New Fuse Chrome extension..."

# Navigate to the Chrome extension directory
cd packages/chrome-extension

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the extension
echo "🏗️ Building extension..."
pnpm run build

echo "✅ Chrome extension built successfully!"
echo "The extension package is available in the packages/chrome-extension/dist directory."
