#!/bin/bash
set -e

echo "🚀 Building The New Fuse VS Code extension..."

# Navigate to the VS Code extension directory
cd packages/vscode-extension

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the extension
echo "🏗️ Building extension..."
npm run build

# Package the extension
echo "📦 Packaging extension..."
npm run package

echo "✅ VS Code extension built successfully!"
echo "The extension package is available in the packages/vscode-extension/dist directory."
