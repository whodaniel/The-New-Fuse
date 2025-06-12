#!/bin/bash

# Test script for The New Fuse Chrome Extension
echo "🧪 Testing The New Fuse Chrome Extension..."

EXTENSION_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/dist-backup-working"

echo "📁 Extension directory: $EXTENSION_DIR"

# Check if required files exist
echo "📋 Checking required files..."

required_files=(
    "manifest.json"
    "background.js"
    "content.js"
    "popup.html"
    "popup.js"
    "popup.css"
    "enhanced-theme.css"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$EXTENSION_DIR/$file" ]]; then
        missing_files+=("$file")
        echo "❌ Missing: $file"
    else
        echo "✅ Found: $file"
    fi
done

if [[ ${#missing_files[@]} -eq 0 ]]; then
    echo "🎉 All required files are present!"
else
    echo "⚠️  Missing ${#missing_files[@]} files"
fi

# Check manifest.json syntax
echo "🔍 Checking manifest.json syntax..."
if jq empty "$EXTENSION_DIR/manifest.json" 2>/dev/null; then
    echo "✅ manifest.json syntax is valid"
else
    echo "❌ manifest.json syntax error"
fi

# Check for basic JavaScript syntax errors
echo "🔍 Checking JavaScript files..."
js_files=("background.js" "content.js" "popup.js")

for js_file in "${js_files[@]}"; do
    if [[ -f "$EXTENSION_DIR/$js_file" ]]; then
        # Use node to check basic syntax
        if node -c "$EXTENSION_DIR/$js_file" 2>/dev/null; then
            echo "✅ $js_file syntax is valid"
        else
            echo "❌ $js_file has syntax errors"
        fi
    fi
done

echo ""
echo "🚀 Extension test complete!"
echo "📍 To load the extension:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable Developer mode"
echo "   3. Click 'Load unpacked'"
echo "   4. Select: $EXTENSION_DIR"
echo ""
