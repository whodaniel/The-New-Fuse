#!/bin/bash
set -e

echo "🧹 Deep Cleaning Workspace..."
rm -rf node_modules .bunrc
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +

echo "🔍 Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
echo "❌ pnpm is not installed. Please install pnpm first:"
echo "   npm install -g pnpm"
else
echo "✅ pnpm is installed"
fi

echo "⚙️ Installing dependencies with pnpm..."
pnpm install

echo "🏗️ Building the workspace..."
pnpm run build

echo "✅ Setup complete!"