#!/bin/bash

# Fix Native Modules Script v3
# This script ensures all package scripts run and then manually rebuilds problematic native modules.

set -e

echo "🔧 Native Modules Fix Script v3"
echo "================================"

# Ensure nvm is sourced
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Current Node.js version: $NODE_VERSION"

# Recommend Node.js 18.x for best compatibility
if [[ ! "$NODE_VERSION" =~ ^v18\. ]]; then
    echo "⚠️  Warning: Node.js 18.x is recommended for native module compatibility"
    echo "   Current version: $NODE_VERSION"
    
    if command -v nvm &> /dev/null; then
        echo "💡 Switching to Node.js 18 with nvm..."
        nvm use 18
    else
        read -p "   Would you like to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo ""
echo "🧹 Step 1: Cleaning existing installation..."
rm -rf node_modules bun.lockb
echo "✅ Cleaned node_modules and lockfile"

echo ""
echo "📦 Step 2: Installing packages (allowing scripts)..."
pnpm install
echo "✅ Packages installed"

echo ""
echo "🔨 Step 3: Manually rebuilding native modules just in case..."

# Rebuild canvas
if [ -d "node_modules/canvas" ]; then
    echo "✅ Canvas package found, rebuilding..."
    (cd node_modules/canvas && npx node-gyp rebuild)
    echo "✅ Canvas native bindings compiled"
else
    echo "⚠️  Canvas package not found."
fi

# Rebuild drivelist
if [ -d "node_modules/drivelist" ]; then
    echo "✅ drivelist package found, rebuilding..."
    (cd node_modules/drivelist && npx node-gyp rebuild)
    echo "✅ drivelist native bindings compiled"
else
    echo "⚠️  drivelist package not found."
fi

echo ""
echo "🎉 Native modules fix complete!"
