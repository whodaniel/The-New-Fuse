#!/bin/bash

# Test TNF Relay Integration Build
# File: test-tnf-integration.sh

echo "🔧 Building TNF Relay Integration..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/The New Fuse Chrome extension June-4-25Archive/chrome-extension"

echo "📦 Installing dependencies..."
bun install

echo "🔨 Building extension..."
bun run build

if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  echo "📁 Extension files are in: dist/"
  echo ""
  echo "🧪 To test the extension:"
  echo "1. Open Chrome/Edge and go to chrome://extensions/"
  echo "2. Enable 'Developer mode'"
  echo "3. Click 'Load unpacked' and select the 'dist' folder"
  echo "4. The extension should appear with TNF Relay tab"
  echo ""
  echo "🔗 TNF Relay Integration Features:"
  echo "   • Connection tab - Configure relay URL and port"
  echo "   • Elements tab - Auto-detect or manually select elements"
  echo "   • Controls tab - Start/stop AI sessions, floating panel"
  echo "   • Keyboard shortcuts: Ctrl+Shift+F (floating panel), Ctrl+Shift+D (element detection)"
  echo ""
  echo "📋 Testing checklist:"
  echo "   1. Navigate to a supported AI platform (ChatGPT, Claude, etc.)"
  echo "   2. Click the extension icon and go to TNF Relay tab"
  echo "   3. Test connection to ws://localhost:3001 (if relay server is running)"
  echo "   4. Try element auto-detection with Ctrl+Shift+D"
  echo "   5. Toggle floating panel with Ctrl+Shift+F"
  echo "   6. Test manual element selection modes"
else
  echo "❌ Build failed! Check the output above for errors."
  exit 1
fi
