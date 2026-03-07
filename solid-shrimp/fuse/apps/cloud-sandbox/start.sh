#!/bin/sh
set -e

echo "🚀 Starting Cloud Sandbox (Fresh Build)..."
echo "📦 Installing Playwright browsers..."

# Install Playwright Chromium browser
export PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
chmod 777 "$PLAYWRIGHT_BROWSERS_PATH"

npx playwright install chromium --with-deps 2>&1 || echo "Warning: Browser installation may have issues"

echo "✅ Browser installation complete"
echo "📋 Starting Node.js server from FRESH build..."

# Set path for node to find modules if needed
export NODE_PATH=/app/apps/cloud-sandbox/node_modules

exec node /app/dist-fresh/server.js
