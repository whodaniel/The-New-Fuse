#!/bin/bash

# Smart Install Script - Handles Bun + Native Modules Automatically
# This script detects native module issues and applies fixes automatically

set -e

echo "🚀 Smart Install - Bun + Native Modules"
echo "======================================="

# Function to check if canvas is properly installed
check_canvas() {
    if [ -d "node_modules/canvas" ] && [ -f "node_modules/canvas/build/Release/canvas.node" ]; then
        return 0  # Canvas is properly installed
    else
        return 1  # Canvas needs fixing
    fi
}

# Function to test canvas functionality
test_canvas() {
    if node -e "const { createCanvas } = require('canvas'); createCanvas(200, 200);" 2>/dev/null; then
        return 0  # Canvas works
    else
        return 1  # Canvas doesn't work
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Current Node.js version: $NODE_VERSION"

# Recommend Node.js 18.x for best compatibility
if [[ ! "$NODE_VERSION" =~ ^v18\. ]] && [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "⚠️  Warning: Node.js 18.x or 20.x is recommended for native module compatibility"
    echo "   Current version: $NODE_VERSION"
fi

echo ""
echo "📦 Step 1: Installing packages with Bun..."

# Try normal bun install first
if bun install; then
    echo "✅ Bun install completed"
else
    echo "⚠️  Bun install had issues, trying with --ignore-scripts..."
    bun install --ignore-scripts
fi

echo ""
echo "🔍 Step 2: Checking native modules..."

# Check if canvas needs fixing
if check_canvas && test_canvas; then
    echo "✅ Canvas is properly installed and working"
    echo "🎉 Installation complete - no native module fixes needed!"
    exit 0
else
    echo "⚠️  Canvas needs fixing - applying native module fix..."
fi

echo ""
echo "🛠️  Step 3: Applying native module fixes..."

# Apply the canvas fix
if [ -d "node_modules/canvas" ]; then
    echo "   Compiling canvas native bindings..."
    cd node_modules/canvas
    
    # Check if node-gyp is available
    if command -v node-gyp &> /dev/null; then
        node-gyp rebuild
    else
        echo "   Using npx node-gyp..."
        npx node-gyp rebuild
    fi
    
    cd ../..
    echo "✅ Canvas native bindings compiled"
else
    echo "❌ Canvas package not found - this indicates a dependency issue"
    echo "   Trying to reinstall with --ignore-scripts..."
    rm -rf node_modules bun.lockb
    bun install --ignore-scripts
    
    if [ -d "node_modules/canvas" ]; then
        echo "   Canvas package now found, compiling..."
        cd node_modules/canvas
        if command -v node-gyp &> /dev/null; then
            node-gyp rebuild
        else
            npx node-gyp rebuild
        fi
        cd ../..
    else
        echo "❌ Canvas still not found after reinstall"
        exit 1
    fi
fi

echo ""
echo "🧪 Step 4: Verifying native modules..."

# Test canvas functionality
if test_canvas; then
    echo "✅ Canvas is working correctly"
else
    echo "❌ Canvas test failed - there may be system dependency issues"
    echo ""
    echo "💡 System dependencies may be missing. Install them with:"
    echo "   macOS: brew install cairo pango libpng jpeg giflib librsvg"
    echo "   Ubuntu: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev"
    echo ""
    echo "   Then run: bun run fix:native-modules"
    exit 1
fi

echo ""
echo "🎉 Smart install complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Packages installed with Bun"
echo "   ✅ Native modules compiled and verified"
echo "   ✅ Canvas functionality confirmed"
echo ""
echo "🚀 You can now run:"
echo "   bun run build"
echo "   bun run dev"
echo "   bun run test"