#!/bin/bash

# Quick Development Environment Fix
# Addresses the immediate native module and Electron issues

set -e

echo "⚡ Quick fix for development environment..."

# Fix 1: Rebuild the specific native module causing issues
echo "🔨 Rebuilding find-git-repositories native module..."

# Navigate to the problematic module
cd node_modules/@theia/git/node_modules/find-git-repositories

# Clean and rebuild
rm -rf build/
npm run install || node-gyp rebuild || {
    echo "⚠️  Native module rebuild failed, trying alternative approach..."
    # Try with different node-gyp flags
    node-gyp rebuild --verbose || {
        echo "⚠️  Still failing, installing node-gyp globally and retrying..."
        npm install -g node-gyp
        node-gyp rebuild
    }
}

cd - > /dev/null

# Fix 2: Fix Electron installation
echo "⚡ Fixing Electron installation..."

# Remove corrupted Electron
rm -rf node_modules/electron

# Reinstall Electron
echo "📦 Reinstalling Electron..."
pnpm add electron@latest --dev

# Fix 3: Clear problematic build artifacts
echo "🧹 Clearing build artifacts..."
rm -rf .turbo/
rm -rf apps/theia-ide/lib/
rm -rf apps/theia-ide/src-gen/

echo "✅ Quick fix complete! Try running 'pnpm run dev' again."