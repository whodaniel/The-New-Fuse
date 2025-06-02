#!/bin/bash
set -e

echo "Starting Chrome extension build process using Yarn Berry workspace..."

# Get the workspace root directory
WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_EXT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Workspace root: $WORKSPACE_ROOT"
echo "Chrome extension dir: $CHROME_EXT_DIR"

# Change to chrome extension directory
cd "$CHROME_EXT_DIR"

# Generate icons first
echo "Generating icons..."
if [ -f "generate-icons.cjs" ]; then
    node generate-icons.cjs
fi

echo "Generating notification icons..."
if [ -f "scripts/generate-notification-icons.cjs" ]; then
    node scripts/generate-notification-icons.cjs
fi

# Clean previous build
echo "Cleaning previous build..."
if [ -d "dist" ]; then
    rm -rf dist
fi

# Create dist directory
mkdir -p dist

# Run webpack build using yarn workspace command from root
echo "Building with webpack using workspace command..."
cd "$WORKSPACE_ROOT"
yarn workspace the-new-fuse-chrome-extension run build

echo "Build completed successfully!"
echo "Extension files are in: $CHROME_EXT_DIR/dist"

# Verify build output
if [ -d "$CHROME_EXT_DIR/dist" ]; then
    echo "Build verification:"
    ls -la "$CHROME_EXT_DIR/dist"
else
    echo "Warning: dist directory not found after build"
fi
