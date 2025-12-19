#!/bin/bash

# The New Fuse Chrome Extension - Cleanup Script
# Removes obsolete files and ensures a clean build environment

echo "🧹 Cleaning up The New Fuse Chrome Extension..."

# Remove obsolete files
echo "Removing obsolete files..."

# Remove old popup files
rm -f src/popup/popup.js
rm -f src/popup/popup-enhanced.js
rm -f src/popup/popup.css
rm -f src/popup/dark-theme.css
rm -f src/popup/light-theme.css
rm -f src/popup/popup-template.html
rm -f src/popup/options.html
rm -f src/popup/convert-icons.html
rm -f src/popup/debug-tools.html
rm -f src/popup/websocket-server-worker.html
rm -f src/popup/websocket-test.html
rm -f src/popup/vendor.css
rm -f src/popup/connection-enhancements.css

# Remove old floating panel files
rm -f src/floatingPanel/index.tsx
rm -f src/floatingPanel/FloatingPanel.tsx
rm -f src/floatingPanel/floatingPanel.css

# Remove obsolete style files
rm -f src/styles/enhanced-theme.css
rm -f src/styles/popup.css

# Remove build artifacts
echo "Cleaning build artifacts..."
rm -rf dist/
rm -rf node_modules/.cache/
rm -f *.log

# Remove system files
echo "Removing system files..."
find . -name ".DS_Store" -delete
find . -name "*.log" -delete
find . -name "Thumbs.db" -delete

echo "✅ Cleanup complete!"
echo ""
echo "Now run: bun run build"
