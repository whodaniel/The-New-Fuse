#!/bin/bash

# Compile the correct Chrome Extension files to dist
set -e

echo "🔧 Compiling The New Fuse Chrome Extension (Correct Version)..."

# Navigate to the chrome extension directory
cd "$(dirname "$0")/chrome-extension"

echo "📁 Working in: $(pwd)"

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy the correct popup files (not the React version)
echo "📄 Copying correct popup.html..."
cp popup.html dist/

echo "📄 Copying popup JavaScript..."
cp popup-fixed.js dist/popup.js

# Copy manifest
echo "📄 Copying manifest.json..."
cp manifest.json dist/

# Copy background script
echo "📄 Copying background script..."
if [ -f "background.js" ]; then
    cp background.js dist/
elif [ -f "background/background.js" ]; then
    cp background/background.js dist/background.js
fi

# Copy content script
echo "📄 Copying content script..."
if [ -f "content.js" ]; then
    cp content.js dist/
elif [ -f "content/content.js" ]; then
    cp content/content.js dist/content.js
fi

# Copy icons
echo "📄 Copying icons..."
if [ -d "icons" ]; then
    cp -r icons dist/
fi

# Copy styles if they exist
if [ -f "styles.css" ]; then
    echo "📄 Copying styles.css..."
    cp styles.css dist/
fi

if [ -f "popup.css" ]; then
    echo "📄 Copying popup.css..."
    cp popup.css dist/
fi

# List the final dist contents
echo "✅ Compilation complete! Final dist contents:"
ls -la dist/

echo ""
echo "🚀 Ready to load in Chrome:"
echo "   1. Open Chrome → chrome://extensions/"
echo "   2. Enable Developer mode (top right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the dist/ folder"
echo "   5. The extension will load with the correct modern UI!"
