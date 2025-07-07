#!/bin/bash

set -e

echo "🏗️ Building Fixed VSCode Extension..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Fix TypeScript errors first
../../scripts/fix-vscode-errors.sh

# Install dependencies
echo "Installing dependencies..."
bun install

# Build
echo "Building extension..."
bun run compile

# Package if compile succeeds
if [ $? -eq 0 ]; then
    echo "Packaging extension..."
    bun run package
    echo "✅ VSCode extension built and packaged successfully!"
    ls -la *.vsix
else
    echo "❌ Build failed"
    exit 1
fi