#!/bin/bash

# This script packages the original Chrome extension for distribution

echo "Packaging original Chrome extension..."

# Check if the chrome-extension directory exists
if [ ! -d "chrome-extension" ]; then
  echo "Error: chrome-extension directory not found"
  exit 1
fi

# Create a zip file of the Chrome extension
cd chrome-extension
zip -r ../the-new-fuse-chrome-extension.zip *

echo "Original Chrome extension packaged as the-new-fuse-chrome-extension.zip"
echo "You can now load this extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked' to select the chrome-extension directory."
echo "Or you can distribute the zip file to users who can then unzip it and load it as an unpacked extension."
