#!/bin/bash

# Ensure we're using Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🔄 Switching to Node 20..."
nvm use 20

echo "✅ Current Node version:"
node -v

echo ""
echo "🧹 Cleaning previous build artifacts..."
rm -rf lib dist src-gen node_modules/.cache

echo ""
echo "📦 Installing dependencies..."
bun install

echo ""
echo "🔨 Building Theia IDE..."
NODE_OPTIONS="--max-old-space-size=8192" bun run build

echo ""
echo "✅ Build complete! To start the server, run:"
echo "   ./start-with-node20.sh"
