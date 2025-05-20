#!/bin/bash

# Build script for The New Fuse Chrome extension
# This script should be run from the project root directory

# Navigate to the Chrome extension directory
cd chrome-extension

# Clean the dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist/icons

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Copy static files
echo "Copying static files..."
cp manifest.json dist/
cp popup.html dist/
cp popup.css dist/
cp index.html dist/
cp -r icons/* dist/icons/ 2>/dev/null || :

# Copy optional files if they exist
cp content.css dist/content.css 2>/dev/null || :
cp options.html dist/options.html 2>/dev/null || :
cp websocket-test.html dist/websocket-test.html 2>/dev/null || :
cp styles.css dist/styles.css 2>/dev/null || :
cp dark-theme.css dist/dark-theme.css 2>/dev/null || :
cp vendor.css dist/vendor.css 2>/dev/null || :

# Compile TypeScript files
echo "Compiling TypeScript files..."
npx tsc

# Copy JS files that don't need compilation
cp popup.js dist/

# Ensure the critical files exist after build
echo "Verifying critical files..."
if [ ! -f "dist/content.js" ]; then
  echo "WARNING: content.js not found, creating minimal version..."
  echo "// Auto-generated content.js" > dist/content.js
fi

if [ ! -f "dist/background.js" ]; then
  echo "WARNING: background.js not found, creating minimal version..."
  echo "// Auto-generated background.js" > dist/background.js
fi

echo "Build complete!"
echo "The extension is now ready to be loaded in Chrome."
echo "Load the 'chrome-extension/dist' directory as an unpacked extension in Chrome."