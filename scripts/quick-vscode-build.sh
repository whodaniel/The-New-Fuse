#!/bin/bash

set -e

echo "🚀 Quick VSCode Extension Build..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

# Install dependencies locally
echo "Installing VSCode extension dependencies..."
bun install --no-cache

# Build
echo "Building..."
bun run compile

echo "✅ VSCode extension compiled successfully!"