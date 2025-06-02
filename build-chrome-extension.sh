#!/bin/bash

# Build and Test Script for Enhanced Chrome Extension
set -e

echo "🏗️  Building Enhanced TNF Chrome Extension v2.0..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/chrome-extension"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_color() {
    echo -e "${2}${1}${NC}"
}

# Check if we're in the right directory
if [ ! -d "$EXTENSION_DIR" ]; then
    echo_color "❌ Chrome extension directory not found at: $EXTENSION_DIR" $RED
    exit 1
fi

cd "$EXTENSION_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo_color "❌ Node.js is required but not installed" $RED
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo_color "❌ npm is required but not installed" $RED
    exit 1
fi

echo_color "📦 Installing dependencies..." $BLUE
npm install

echo_color "🔧 Building TypeScript files..." $BLUE
# Create dist directory if it doesn't exist
mkdir -p dist

# Copy static files
echo_color "📋 Copying static files..." $YELLOW
cp src/manifest.json dist/
cp -r public/* dist/ 2>/dev/null || true
cp src/styles/*.css dist/ 2>/dev/null || true

# Build TypeScript files (simplified for this demo)
echo_color "⚙️  Compiling TypeScript..." $YELLOW

# Compile background script
npx tsc src/background.ts --outDir dist --target ES2020 --module ES2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict

# Compile content script
npx tsc src/content/index.ts --outDir dist --target ES2020 --module ES2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict

# Compile popup
npx tsc src/popup/index.ts --outDir dist --target ES2020 --module ES2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict

# Compile element selector
npx tsc src/content/element-selector.ts --outDir dist/content --target ES2020 --module ES2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict

# Compile element selection manager
npx tsc src/popup/element-selection-manager.ts --outDir dist/popup --target ES2020 --module ES2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict

echo_color "🎨 Processing CSS files..." $YELLOW
# Copy CSS files
cp src/styles/element-selection.css dist/
cp styles.css dist/ 2>/dev/null || true

echo_color "📱 Creating extension package..." $YELLOW
# Create a zip file for distribution
cd dist
zip -r "../tnf-chrome-extension-v2.zip" . -x "*.DS_Store" "*.map"
cd ..

echo_color "✅ Build completed successfully!" $GREEN
echo ""
echo_color "📦 Extension files are in: $EXTENSION_DIR/dist" $BLUE
echo_color "📁 Distribution package: $EXTENSION_DIR/tnf-chrome-extension-v2.zip" $BLUE
echo ""

# Test if enhanced relay is available
echo_color "🔍 Checking TNF Relay availability..." $YELLOW
if curl -s http://localhost:3000/status > /dev/null 2>&1; then
    echo_color "✅ Enhanced TNF Relay is running!" $GREEN
else
    echo_color "⚠️  Enhanced TNF Relay not detected" $YELLOW
    echo "   Start it with: ./start-enhanced-relay.sh"
fi

echo ""
echo_color "🚀 Installation Instructions:" $BLUE
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top right"
echo "3. Click 'Load unpacked' and select: $EXTENSION_DIR/dist"
echo "4. Pin the extension to your toolbar"
echo "5. Configure relay connection in extension settings"
echo ""

echo_color "🧪 To test the extension:" $BLUE
echo "1. Visit https://chat.openai.com or https://claude.ai"
echo "2. Click the TNF extension icon"
echo "3. Use 'Auto-Detect Elements' or manual selection"
echo "4. Test automation features"
echo ""

echo_color "✨ Build complete! The New Fuse Chrome Extension v2.0 is ready!" $GREEN
