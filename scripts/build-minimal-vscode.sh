#!/bin/bash

set -e

echo "🚀 Building Minimal VSCode Extension..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Use minimal package.json
cp package-minimal.json package.json

# Install minimal dependencies
echo "Installing minimal dependencies..."
bun install

# Create dist directory
mkdir -p dist

# Build with esbuild directly
echo "Building extension..."
bunx esbuild src/extension-minimal.ts --bundle --outfile=dist/extension-minimal.js --external:vscode --format=cjs --platform=node

# Package extension
echo "Packaging extension..."
bunx vsce package

echo "✅ Minimal VSCode extension built successfully!"
ls -la *.vsix