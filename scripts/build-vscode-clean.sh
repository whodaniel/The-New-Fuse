#!/bin/bash

set -e

echo "🏗️ Building Clean VSCode Extension..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Fix remaining errors
chmod +x ../../scripts/fix-vscode-errors.sh
../../scripts/fix-vscode-errors.sh

# Build
echo "Building clean extension..."
bun run compile

if [ $? -eq 0 ]; then
    echo "Packaging extension..."
    bun run package
    echo "✅ VSCode extension built successfully!"
    ls -la *.vsix
else
    echo "❌ Build still failing - checking for more errors..."
    echo "Files in src/:"
    find src/ -name "*.ts" | head -20
fi