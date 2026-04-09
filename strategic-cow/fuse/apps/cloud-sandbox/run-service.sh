#!/bin/sh
set -e

echo "🚀 Starting Cloud Sandbox (Custom Script)..."
echo "📦 Installing Playwright browsers..."

# Install Playwright Chromium browser
npx playwright install chromium --with-deps 2>&1 || echo "Warning: Browser installation may have issues"

echo "✅ Browser installation complete"
echo "📋 Starting Node.js server..."

exec node dist/server.js
