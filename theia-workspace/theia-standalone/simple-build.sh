#!/bin/bash

# Simple Theia Build with Node 20 and Bun
set -e

# Ensure we're using Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🔄 Switching to Node 20..."
nvm use 20

echo "✅ Current Node version: $(node -v)"

# Set memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

echo ""
echo "🧹 Cleaning previous build artifacts..."
rm -rf lib dist src-gen node_modules/.cache

echo ""
echo "📦 Installing dependencies with bun..."
bun install

echo ""
echo "🔧 Generating Theia application files..."
bun x @theia/cli generate

echo ""
echo "🔨 Building Theia IDE..."
bun x @theia/cli build --mode development

echo ""
echo "✅ Build complete!"
echo ""
echo "To start the server, run:"
echo "   ./start-with-node20.sh"
