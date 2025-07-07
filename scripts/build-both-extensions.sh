#!/bin/bash

set -e

echo "🚀 Building Both Extensions with Bun..."

# Build VSCode Extension
echo "Building VSCode Extension..."
cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"
bun install
bun run build
bun run package

# Build Chrome Extension  
echo "Building Chrome Extension..."
cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension"
bun install
bun run build
bun run package

echo "✅ Both extensions built successfully!"
echo "📦 VSCode: $(ls /Users/<owner>/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/src/vscode-extension/*.vsix 2>/dev/null || echo 'Build check package.json')"
echo "📦 Chrome: $(ls /Users/<owner>/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/chrome-extension/*.zip 2>/dev/null || echo 'Available in dist/')"