#!/bin/bash

# Fix Native Modules for The New Fuse
# This script ensures all native modules are properly built

echo "🔧 Fixing native modules for The New Fuse..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure we have required tools
if ! command_exists node-gyp; then
    echo "📦 Installing node-gyp globally..."
    npm install -g node-gyp
fi

# Fix Canvas (if present)
if [ -d "node_modules/canvas" ]; then
    echo "📦 Fixing Canvas..."
    if [ ! -f "node_modules/canvas/build/Release/canvas.node" ]; then
        echo "  Building Canvas native module..."
        cd node_modules/canvas
        node-gyp rebuild || npx node-gyp rebuild
        cd ../..
        if [ -f "node_modules/canvas/build/Release/canvas.node" ]; then
            echo "  ✅ Canvas built successfully"
        else
            echo "  ⚠️  Canvas build failed - may need system dependencies"
        fi
    else
        echo "  ✅ Canvas already built"
    fi
fi

# Fix ripgrep
echo "📦 Fixing @vscode/ripgrep..."
if [ ! -f "node_modules/@vscode/ripgrep/bin/rg" ]; then
    echo "  Installing ripgrep binary..."
    node node_modules/@vscode/ripgrep/lib/postinstall.js
    if [ -f "node_modules/@vscode/ripgrep/bin/rg" ]; then
        echo "  ✅ ripgrep binary installed successfully"
    else
        echo "  ❌ Failed to install ripgrep binary"
        exit 1
    fi
else
    echo "  ✅ ripgrep binary already exists"
fi

# Fix node-pty
echo "📦 Fixing node-pty..."
if [ ! -f "node_modules/node-pty/build/Release/spawn-helper" ]; then
    echo "  Building node-pty native module..."
    cd node_modules/node-pty
    npx node-gyp rebuild || node-gyp rebuild
    cd ../..
    if [ -f "node_modules/node-pty/build/Release/spawn-helper" ]; then
        echo "  ✅ node-pty built successfully"
    else
        echo "  ❌ Failed to build node-pty"
        exit 1
    fi
else
    echo "  ✅ node-pty already built"
fi

# Verify all native modules
echo "🔍 Verifying native modules..."
echo "  Canvas: $([ -f "node_modules/canvas/build/Release/canvas.node" ] && echo "✅ OK" || echo "⏭️  Not required")"
echo "  Ripgrep: $([ -f "node_modules/@vscode/ripgrep/bin/rg" ] && echo "✅ OK" || echo "❌ Missing")"
echo "  Node-pty: $([ -f "node_modules/node-pty/build/Release/spawn-helper" ] && echo "✅ OK" || echo "❌ Missing")"

echo "✅ Native modules fix complete!"