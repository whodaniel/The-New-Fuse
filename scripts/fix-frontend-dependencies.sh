#!/bin/bash

# Fix Frontend Dependencies Issues
set -e

echo "🔧 Fixing frontend dependency issues..."

# Fix 1: Install missing dependencies
echo "📦 Installing missing dependencies..."
bun add cookie @chakra-ui/icons

# Fix 2: Fix the cookie package issue in react-router-dom
echo "🍪 Fixing cookie package resolution..."
bun add cookie@latest

# Fix 3: Clear Vite cache and node_modules cache
echo "🧹 Clearing frontend caches..."
rm -rf apps/frontend/node_modules/.vite/
rm -rf apps/frontend/dist/
rm -rf node_modules/.cache/

# Fix 4: Reinstall frontend dependencies
echo "📦 Reinstalling frontend dependencies..."
cd apps/frontend
bun install --force
cd - > /dev/null

echo "✅ Frontend dependencies fixed!"