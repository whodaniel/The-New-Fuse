#!/bin/sh
set -e

echo "🚀 Starting Cloud Sandbox (Custom Script)..."
echo "📦 Preparing Playwright browser path..."

if [ -z "$PLAYWRIGHT_BROWSERS_PATH" ]; then
  PLAYWRIGHT_BROWSERS_PATH="$HOME/pw-browsers"
fi

if ! mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" 2>/dev/null; then
  echo "⚠️  Cannot write to $PLAYWRIGHT_BROWSERS_PATH, falling back to /tmp/pw-browsers"
  PLAYWRIGHT_BROWSERS_PATH="/tmp/pw-browsers"
  mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
fi

export PLAYWRIGHT_BROWSERS_PATH
echo "✅ Playwright path: $PLAYWRIGHT_BROWSERS_PATH"
echo "📦 Installing Playwright browsers..."

# Install Playwright Chromium browser
npx playwright install chromium 2>&1 || echo "Warning: Browser installation may have issues"

echo "✅ Browser installation complete"
echo "📋 Starting Node.js server..."

exec node dist/server.js
