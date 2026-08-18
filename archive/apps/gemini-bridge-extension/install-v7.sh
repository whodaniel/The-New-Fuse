#!/bin/bash

# Fuse Connect v7 - Complete Installer
# Fully automatic - builds extension and installs native messaging host wrapper

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR"
DIST_DIR="$SCRIPT_DIR/dist-v7"

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
echo "║           ⚡ FUSE CONNECT v7 INSTALLER ⚡                  ║"
echo "║     Chrome Extension + Native Messaging Host              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Build the extension
echo -e "${YELLOW}📦 Step 1: Building Chrome Extension...${NC}"
cd "$EXTENSION_DIR"

npm run build:v7

echo -e "${GREEN}✅ Extension built successfully!${NC}"
echo ""

# Step 2: Install native messaging host
echo -e "${YELLOW}🔧 Step 2: Installing Native Messaging Host...${NC}"

# Create directory
mkdir -p "$NATIVE_MESSAGING_HOSTS_DIR"

# Get the path to the node binary
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  # Fallback for common NVM path if 'which' fails in this context
  NODE_PATH="$HOME/.nvm/versions/node/v24.12.0/bin/node"
fi

echo "   📍 Using Node: $NODE_PATH"

# Get the path to the native host script
NATIVE_HOST_JS_PATH="$DIST_DIR/native-host/tnf-native-host.cjs"
NATIVE_HOST_SH_PATH="$DIST_DIR/native-host/tnf-native-host.sh"

# Create a shell wrapper that ensures Node is found with absolute path
cat > "$NATIVE_HOST_SH_PATH" << EOF
#!/bin/bash
# TNF Native Messaging Host Launcher
# Ensures the correct Node environment is used

# Set path to include common Node locations just in case
export PATH="\$PATH:/usr/local/bin:/usr/bin:/bin"

# Run the host script using the absolute Node path detected during installation
"$NODE_PATH" "$NATIVE_HOST_JS_PATH" "\$@"
EOF

# Make both executable
chmod +x "$NATIVE_HOST_JS_PATH"
chmod +x "$NATIVE_HOST_SH_PATH"

# Create the native messaging host manifest pointing to the SHELL WRAPPER
cat > "$NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "Fuse Connect v7 - Controls TNF services from Chrome Extension",
  "path": "$NATIVE_HOST_SH_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo -e "${GREEN}✅ Native messaging host installed via launcher script!${NC}"
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
echo -e "${GREEN}📍 Native Host Manifest:${NC}"
echo "   $NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json"
echo ""
echo -e "${GREEN}📍 Native Host Launcher:${NC}"
echo "   $NATIVE_HOST_SH_PATH"
echo ""
echo -e "${YELLOW}🚀 IMPORTANT: RELOAD EXTENSION IN CHROME${NC}"
echo "   1. Open Chrome → chrome://extensions/"
echo "   2. Find 'Fuse Connect'"
echo "   3. Click the reload icon (↻)"
echo ""
echo -e "${CYAN}⌨️  Keyboard Shortcut: Ctrl+Shift+F (toggle floating panel)${NC}"
echo ""
