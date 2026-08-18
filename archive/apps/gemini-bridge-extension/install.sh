#!/bin/bash

# Fuse Connect v6 - Complete Installer
# Fully automatic - builds extension and installs native messaging host

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR"
DIST_DIR="$SCRIPT_DIR/dist-v5"

# Fixed extension ID (derived from the key in manifest.json)
EXTENSION_ID="fkbcklmcikdhpggaimfhomgncneppkbj"

# Native host config
HOST_NAME="com.thenewfuse.native_host"
NATIVE_MESSAGING_HOSTS_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           ⚡ FUSE CONNECT v6 INSTALLER ⚡                  ║"
echo "║     Chrome Extension + Native Messaging Host              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Build the extension
echo -e "${YELLOW}📦 Step 1: Building Chrome Extension...${NC}"
cd "$EXTENSION_DIR"

if command -v pnpm &> /dev/null; then
  pnpm exec webpack --config webpack.v5.config.cjs --mode production
elif command -v npm &> /dev/null; then
  npx webpack --config webpack.v5.config.cjs --mode production
else
  echo -e "${RED}Error: pnpm or npm is required${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Extension built successfully!${NC}"
echo ""

# Step 2: Install native messaging host
echo -e "${YELLOW}🔧 Step 2: Installing Native Messaging Host...${NC}"

# Create directory
mkdir -p "$NATIVE_MESSAGING_HOSTS_DIR"

# Get the path to the native host script
NATIVE_HOST_PATH="$DIST_DIR/native-host/tnf-native-host.js"

# Make executable
chmod +x "$NATIVE_HOST_PATH"

# Create the native messaging host manifest with correct path
cat > "$NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "Fuse Connect v6 - Controls TNF services from Chrome Extension",
  "path": "$NATIVE_HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo -e "${GREEN}✅ Native messaging host installed!${NC}"
echo ""

# Step 3: Summary
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                   ✅ INSTALLATION COMPLETE                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${GREEN}📍 Extension Location:${NC}"
echo "   $DIST_DIR"
echo ""
echo -e "${GREEN}📍 Extension ID (fixed):${NC}"
echo "   $EXTENSION_ID"
echo ""
echo -e "${GREEN}📍 Native Host:${NC}"
echo "   $NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json"
echo ""
echo -e "${YELLOW}🚀 To Load in Chrome:${NC}"
echo "   1. Open Chrome → chrome://extensions/"
echo "   2. Enable 'Developer mode' (top right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select: $DIST_DIR"
echo ""
echo -e "${CYAN}⌨️  Keyboard Shortcut: Ctrl+Shift+F (toggle floating panel)${NC}"
echo ""
echo -e "${GREEN}The extension ID is fixed - native messaging will work automatically!${NC}"
echo ""
