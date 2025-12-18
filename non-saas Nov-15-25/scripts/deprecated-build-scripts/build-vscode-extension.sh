#!/bin/bash
set -e

echo "🚀 Building The New Fuse VS Code extension..."

# Navigate to the VS Code extension directory
cd packages/vscode-extension

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the extension
echo "🏗️ Building extension..."
pnpm run build

# Package the extension
echo "📦 Packaging extension..."
pnpm run package

echo "✅ VS Code extension built successfully!"
echo "The extension package is available in the packages/vscode-extension/dist directory."
