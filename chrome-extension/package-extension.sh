#!/bin/bash
set -e

echo "📦 Packaging Chrome Extension for Distribution"
echo "=============================================="

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_EXT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_NAME="the-new-fuse-chrome-extension-$(date +%Y%m%d-%H%M%S).zip"

echo "Workspace root: $WORKSPACE_ROOT"
echo "Chrome extension dir: $CHROME_EXT_DIR"

# Change to workspace root and build
cd "$WORKSPACE_ROOT"
echo "🔧 Building Chrome extension..."
bun build:chrome

# Change to chrome extension directory
cd "$CHROME_EXT_DIR"

# Create package directory if it doesn't exist
mkdir -p packages

# Clean up any existing package
if [ -f "packages/$PACKAGE_NAME" ]; then
    rm "packages/$PACKAGE_NAME"
fi

# Create the zip package
echo "📦 Creating package: $PACKAGE_NAME"
cd dist
zip -r "../packages/$PACKAGE_NAME" .
cd ..

echo "✅ Package created successfully!"
echo "📍 Location: $CHROME_EXT_DIR/packages/$PACKAGE_NAME"
echo "🚀 Ready for Chrome Web Store or manual installation"

# Display package info
if [ -f "packages/$PACKAGE_NAME" ]; then
    echo "📊 Package size: $(du -h "packages/$PACKAGE_NAME" | cut -f1)"
    echo "📁 Package contents:"
    unzip -l "packages/$PACKAGE_NAME" | head -20
fi
