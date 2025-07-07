#!/bin/bash

set -e

echo "🏗️ Building Complete VSCode Extension..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Install dependencies
echo "Installing dependencies..."
bun install

# Build
echo "Building complete extension..."
bun run compile

if [ $? -eq 0 ]; then
    echo "Packaging extension..."
    bun run package
    echo "✅ VSCode extension with full functionality built successfully!"
    ls -la *.vsix
else
    echo "❌ Build failed - checking remaining errors..."
    echo "Remaining TypeScript files:"
    find src/ -name "*.ts" | head -10
fi