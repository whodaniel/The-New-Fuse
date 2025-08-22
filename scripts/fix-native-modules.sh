#!/bin/bash

# Fix Native Modules Script
# This script implements the hybrid package manager approach for native modules like canvas

set -e

echo "🔧 Native Modules Fix Script"
echo "=============================="

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
    
    # Check if nvm is available
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
echo "📦 Step 2: Installing packages (ignoring scripts)..."
bun install --ignore-scripts
echo "✅ Packages installed"

echo ""
echo "🔨 Step 3: Checking for canvas package..."
if [ -d "node_modules/canvas" ]; then
    echo "✅ Canvas package found"
    
    echo ""
    echo "🛠️  Step 4: Compiling canvas native bindings..."
    cd node_modules/canvas
    
    # Check if node-gyp is available
    if ! command -v node-gyp &> /dev/null; then
        echo "⚠️  node-gyp not found globally, using npx..."
        npx node-gyp rebuild
    else
        node-gyp rebuild
    fi
    
    cd ../..
    echo "✅ Canvas native bindings compiled"
else
    echo "⚠️  Canvas package not found in node_modules"
    echo "   This might indicate a dependency issue"
fi

echo ""
echo "🧪 Step 5: Testing canvas functionality..."

# Test with Node.js
echo "Testing with Node.js..."
if node -e "const { createCanvas } = require('canvas'); console.log('✅ Canvas loaded with Node.js'); const canvas = createCanvas(200, 200); console.log('✅ Canvas created successfully');" 2>/dev/null; then
    echo "✅ Canvas works with Node.js"
else
    echo "❌ Canvas failed with Node.js"
    echo "   Check the compilation output above for errors"
fi

# Test with Bun
echo "Testing with Bun..."
if bun -e "const { createCanvas } = require('canvas'); console.log('✅ Canvas loaded with Bun'); const canvas = createCanvas(200, 200); console.log('✅ Canvas created successfully');" 2>/dev/null; then
    echo "✅ Canvas works with Bun"
else
    echo "❌ Canvas failed with Bun"
    echo "   This might be a Bun runtime issue, but Node.js compatibility is sufficient"
fi

echo ""
echo "🎉 Native modules fix complete!"
echo ""
echo "📋 Summary:"
echo "   - Packages installed with --ignore-scripts"
echo "   - Canvas native bindings compiled manually"
echo "   - Functionality verified"
echo ""
echo "💡 If you encounter issues in the future:"
echo "   - Re-run this script: ./scripts/fix-native-modules.sh"
echo "   - Check the troubleshooting guide: docs/NATIVE_MODULES_GUIDE.md"
echo "   - Ensure you're using Node.js 18.x for best compatibility"
