#!/bin/bash
set -e

echo "🧹 Deep Cleaning Workspace..."
rm -rf node_modules bun.lockb .bunrc
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +

echo "🔍 Checking Bun installation..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "⚙️ Installing dependencies with Bun..."
pnpm install

echo "🏗️ Building the workspace..."
pnpm run build

echo "✅ Setup complete!"