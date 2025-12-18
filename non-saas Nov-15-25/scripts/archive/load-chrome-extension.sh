#!/bin/bash

# This script helps load "The New Fuse" Chrome extension for local development and testing.
# It checks for the built extension, opens the Chrome extensions page,
# and provides clear instructions for the user.

set -e # Exit immediately if a command exits with a non-zero status.

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}🚀 Loading The New Fuse Chrome extension for testing...${NC}"

# The path to the built extension, relative to the project root.
EXTENSION_DIR="chrome-extension/dist"

# Check if Chrome is installed
CHROME_APP="/Applications/Google Chrome.app"
if [ ! -d "$CHROME_APP" ]; then
  echo -e "${RED}❌ Error: Google Chrome not found at '$CHROME_APP'.${NC}"
  echo -e "${YELLOW}This script is designed for macOS. Please open chrome://extensions/ manually.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Chrome found.${NC}"

# Check if the extension directory exists
if [ -d "$EXTENSION_DIR" ]; then
  echo -e "${GREEN}✅ Extension build directory found at '$EXTENSION_DIR'.${NC}"
else
  echo -e "${RED}❌ Error: Extension directory '$EXTENSION_DIR' not found.${NC}"
  echo -e "${YELLOW}Please build the extension first by running 'yarn build:chrome' or './fresh-build-and-launch.sh' from the project root.${NC}"
  exit 1
fi

# Check for the manifest file as a basic validation of the build
if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
  echo -e "${YELLOW}⚠️ Warning: 'manifest.json' not found in '$EXTENSION_DIR'. The build might be incomplete.${NC}"
else
  echo -e "${GREEN}✅ manifest.json found.${NC}"
fi

# Open Chrome with the extensions page
echo -e "\n${BLUE}Opening Chrome to the extensions page...${NC}"
open -a "$CHROME_APP" "chrome://extensions/"

echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "1. If not already enabled, toggle on 'Developer mode' in the top-right corner."
echo "2. Click 'Load unpacked'."
echo "3. Select the following directory: $(pwd)/${EXTENSION_DIR}"
echo "4. The 'The New Fuse - Enhanced' extension should now be loaded and ready for testing."
echo ""
echo -e "${YELLOW}To test the WebSocket connection:${NC}"
echo "1. For a full test, ensure the VS Code extension is active (which runs the server on port 3710)."
echo "2. For isolated client testing, run the standalone test server: 'node test-websocket-server-3711.cjs' (runs on port 3711)."
echo "3. Refer to 'docs/guides/COMMUNICATION_ARCHITECTURE.md' for a full overview."
echo "2. Click the extension icon in the Chrome toolbar to open the popup."
echo "3. The Dashboard tab should show the connection status."
echo "4. Navigate to an AI chat page (like Gemini) to test integrations."
echo ""
echo -e "${GREEN}✅ Done!${NC}"
