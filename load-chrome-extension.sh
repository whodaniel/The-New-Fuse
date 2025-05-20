#!/bin/bash

# This script helps load the Chrome extension for testing

echo "Loading Chrome extension for testing..."

# Check if Chrome is installed
if [ -d "/Applications/Google Chrome.app" ]; then
  echo "Chrome found at /Applications/Google Chrome.app"
else
  echo "Error: Chrome not found. Please install Chrome first."
  exit 1
fi

# Check if the extension directory exists
if [ -d "simple-chrome-extension" ]; then
  echo "Extension directory found at simple-chrome-extension"
else
  echo "Error: Extension directory not found. Please make sure you're in the correct directory."
  exit 1
fi

# Check if the icon files exist
if [ -f "simple-chrome-extension/icons/icon16.png" ] && [ -f "simple-chrome-extension/icons/icon48.png" ] && [ -f "simple-chrome-extension/icons/icon128.png" ]; then
  echo "Icon files found"
else
  echo "Warning: Icon files not found. The extension may not display properly."
  echo "Please make sure the following files exist:"
  echo "  - simple-chrome-extension/icons/icon16.png"
  echo "  - simple-chrome-extension/icons/icon48.png"
  echo "  - simple-chrome-extension/icons/icon128.png"
fi

# Open Chrome with the extensions page
echo "Opening Chrome with the extensions page..."
open -a "Google Chrome" "chrome://extensions/"

echo ""
echo "Instructions:"
echo "1. Enable 'Developer mode' in the top-right corner of the extensions page"
echo "2. Click 'Load unpacked' and select the 'simple-chrome-extension' directory"
echo "3. The extension should now be loaded and ready for testing"
echo ""
echo "To test the WebSocket connection:"
echo "1. Make sure the WebSocket server is running (either the test server or the VSCode extension)"
echo "2. Click on the extension icon in Chrome to open the popup"
echo "3. Click 'Connect' to establish a WebSocket connection"
echo "4. Use the interface to send and receive messages"
echo ""
echo "Done!"
