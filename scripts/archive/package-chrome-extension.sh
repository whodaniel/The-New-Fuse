#!/bin/bash

# This script packages the Chrome extension for distribution

echo "Packaging Chrome extension..."

# Check if the chrome-extension-package directory exists
if [ ! -d "chrome-extension-package" ]; then
  echo "Error: chrome-extension-package directory not found"
  exit 1
fi

# Create a zip file of the Chrome extension
cd chrome-extension-package
zip -r ../the-new-fuse-websocket-test.zip manifest.json background.js popup.html popup.js icons/*

echo "Chrome extension packaged as the-new-fuse-websocket-test.zip"
echo "You can now load this extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked' to select the chrome-extension-package directory."
echo "Or you can distribute the zip file to users who can then unzip it and load it as an unpacked extension."
