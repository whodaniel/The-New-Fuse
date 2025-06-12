#!/bin/bash

# Manual Integration Test for The New Fuse Chrome Extension
# This script provides a step-by-step manual testing guide

echo "🧪 The New Fuse Chrome Extension - Manual Integration Test"
echo "========================================================="
echo ""

echo "📋 PREREQUISITES:"
echo "• Chrome browser installed"
echo "• Node.js installed (v14 or higher)"
echo "• WebSocket server files present"
echo ""

echo "🔧 STEP 1: Verify File Existence"
echo "Required files:"
files=(
    "launchWebSocketServer.js"
    "test-websocket-server-3710.cjs" 
    "chrome-extension/manifest.json"
    "chrome-extension/content.js"
    "chrome-extension/background.js"
)

all_present=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
        all_present=false
    fi
done

if [ "$all_present" = false ]; then
    echo ""
    echo "❌ Some required files are missing. Please ensure all files are present."
    exit 1
fi

echo ""
echo "🌐 STEP 2: Start WebSocket Server"
echo "Run this command in a separate terminal:"
echo "    node launchWebSocketServer.js"
echo ""
echo "Expected output:"
echo "    Starting WebSocket server on port 3710..."
echo "    WebSocket server started successfully on port 3710"
echo ""

echo "🎯 STEP 3: Load Chrome Extension"
echo "1. Open Chrome browser"
echo "2. Go to chrome://extensions/"
echo "3. Enable 'Developer mode' (toggle in top-right)"
echo "4. Click 'Load unpacked'"
echo "5. Select the 'chrome-extension' folder from this project"
echo "6. The extension should appear in your extensions list"
echo ""

echo "⌨️ STEP 4: Test Extension Activation"
echo "1. Go to any regular website (e.g., google.com)"
echo "2. Press Ctrl+Shift+F (or Cmd+Shift+F on Mac)"
echo "3. The New Fuse floating panel should appear"
echo "4. Alternatively, click the extension icon in the toolbar"
echo ""

echo "🔌 STEP 5: Test WebSocket Connection"
echo "1. In the floating panel, look for WebSocket connection status"
echo "2. Click 'Connect' button if not already connected"
echo "3. Status should show 'Connected' or green indicator"
echo "4. Try sending a test message in the chat"
echo ""

echo "🧪 STEP 6: Test Server Management"
echo "1. Click 'Start Server' button in the panel"
echo "2. Should show server starting status"
echo "3. Since server is already running, it should detect this"
echo "4. Try 'Stop Server' and 'Start Server' to test management"
echo ""

echo "📊 STEP 7: Verify Functionality"
echo "Expected working features:"
echo "• Panel toggles with keyboard shortcut"
echo "• WebSocket connects to server on port 3710"
echo "• Chat interface accepts input"
echo "• Server status updates correctly"
echo "• Element selection tools work"
echo ""

echo "🔍 TROUBLESHOOTING:"
echo "• If panel doesn't appear: Check browser console for errors"
echo "• If WebSocket won't connect: Ensure server is running on port 3710"
echo "• If extension doesn't load: Check for manifest.json errors"
echo "• If server won't start: Check if port 3710 is already in use"
echo ""

echo "📚 For detailed troubleshooting, see:"
echo "    CHROME_EXTENSION_FINAL_FIXES_COMPLETE.md"
echo "    TROUBLESHOOTING_GUIDE.md"
echo ""

echo "✅ Manual integration test guide complete!"
echo "Follow the steps above to verify all functionality is working."
