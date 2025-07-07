#!/bin/bash

set -e

echo "🏗️ Building VSCode Extension with Bun..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Install dependencies with bun
echo "Installing dependencies..."
bun install

# Build extension
echo "Building extension..."
bun run build

# Package extension
echo "Packaging extension..."
bun run package

echo "✅ VSCode extension built successfully!"
ls -la *.vsix