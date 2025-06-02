#!/bin/bash

echo "🔍 Validating Chrome Extension Build..."

DIST_DIR="./dist"

# Essential files check
ESSENTIAL_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "background.js"
    "content.js"
)

# Icon files check
ICON_FILES=(
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

MISSING_FILES=0

echo "Checking essential files:"
for file in "${ESSENTIAL_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    echo "❌ MISSING: $file"
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "✅ Found: $file"
  fi
done

echo ""
echo "Checking icon files:"
for icon in "${ICON_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$icon" ]; then
    echo "❌ MISSING: $icon"
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "✅ Found: $icon"
  fi
done

echo ""
if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️  $MISSING_FILES essential files are missing!"
  exit 1
else
  echo "🎉 All essential files are present!"
  echo ""
  echo "🚀 Extension is ready to load in Chrome:"
  echo "  1. Open Chrome and go to chrome://extensions/"
  echo "  2. Enable 'Developer mode' (toggle in top-right)"
  echo "  3. Click 'Load unpacked'"
  echo "  4. Select the directory: $(pwd)/dist"
  echo ""
  echo "📁 Extension directory: $(pwd)/dist"
fi
