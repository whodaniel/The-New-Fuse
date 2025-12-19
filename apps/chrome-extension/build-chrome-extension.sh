#!/bin/bash

# The New Fuse - Chrome Extension Builder
# Builds the Chrome extension workspace within The New Fuse monorepo
# Uses bun for package management and webpack for bundling

set -e

echo "🔧 Building The New Fuse Chrome Extension"
echo "========================================="
echo "Workspace: chrome-extension"
echo "Monorepo: The New Fuse"
echo ""

# Get the directory where the script is located (chrome-extension workspace)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Working in: $(pwd)"
echo "🎯 Target: Chrome Extension for AI-powered browser automation"

# Use full path to bun (since it's not in PATH)
BUN_PATH="$HOME/.bun/bin/bun"

if [ ! -f "$BUN_PATH" ]; then
    echo "❌ Bun not found at $BUN_PATH"
    echo "Please install bun or check the path"
    exit 1
fi

echo "✅ Found bun at: $BUN_PATH"

# Install dependencies if needed (within this workspace)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing Chrome extension dependencies with bun..."
    "$BUN_PATH" install
else
    echo "✅ Chrome extension dependencies already installed"
fi

echo ""
echo "🔨 Building Chrome extension workspace..."

# Try to build with full prebuild process first
if "$BUN_PATH" run build; then
    echo "✅ Chrome extension build completed successfully!"
else
    echo "⚠️  Build with prebuild failed, trying direct webpack build..."
    
    # Try running webpack directly without the prebuild step (icon generation)
    if [ -f "node_modules/.bin/webpack" ]; then
        echo "🔄 Running webpack directly for Chrome extension..."
        ./node_modules/.bin/webpack --config webpack.config.cjs --mode production
        echo "✅ Chrome extension build completed (without icon generation)!"
    else
        echo "❌ Webpack not found. Please run: $BUN_PATH install"
        exit 1
    fi
fi

echo ""
echo "📊 Chrome Extension Build Summary"
echo "=================================="

if [ -d "dist" ]; then
    dist_files=$(find dist -type f | wc -l | tr -d ' ')
    echo "✅ Chrome extension built successfully!"
    echo "📁 Output: chrome-extension/dist/ ($dist_files files)"
    echo "🎯 Extension type: AI-powered browser automation"
    echo "🔗 Features: Element detection, TNF Relay integration, agent communication"
    echo ""
    echo "🚀 Next steps to test the Chrome extension:"
    echo "   1. Open Chrome browser"
    echo "   2. Navigate to chrome://extensions/"
    echo "   3. Enable Developer mode (toggle in top right)"
    echo "   4. Click 'Load unpacked extension'"
    echo "   5. Select: $(pwd)/dist/"
    echo ""
    echo "📋 Chrome extension capabilities:"
    echo "   • AI-powered element selection on web pages"
    echo "   • WebSocket communication with TNF backend"
    echo "   • Cross-platform bridge (browser ↔ VSCode)"
    echo "   • Agent-to-agent messaging integration"
    echo ""
    echo "🎉 The New Fuse Chrome extension is ready!"
else
    echo "❌ Chrome extension build failed - dist/ directory not created"
    exit 1
fi
