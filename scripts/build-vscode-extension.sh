#!/bin/bash

set -e

echo "🏗️ Building VSCode Extension with Bun..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Install dependencies with pnpm
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build extension
echo "Building extension..."
pnpm run build

# Package extension
echo "Packaging extension..."
pnpm run package

echo "✅ VSCode extension built successfully!"
ls -la *.vsix