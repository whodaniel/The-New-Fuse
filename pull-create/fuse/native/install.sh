#!/bin/bash
set -e

# This script installs the native messaging host for The New Fuse Chrome Extension on macOS.
# It must be run with the Chrome Extension ID as the first argument.
# Example: ./install.sh cjpalhdlnbpafiamejdnhcphjbkeiagm

# --- Configuration ---
HOST_NAME="com.thenewfuse.native_host"
DEST_DIR="$HOME/Library/Application Support/TheNewFuse/NativeHost"
CHROME_MANIFEST_DEST="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
CHROMIUM_MANIFEST_DEST="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"

# --- Validation ---
if [ -z "$1" ]; then
  echo "Error: Chrome Extension ID is required."
  echo "Usage: $0 <your_chrome_extension_id>"
  echo "You can find the ID in Chrome at chrome://extensions"
  exit 1
fi
EXT_ID="$1"

# Get the directory of the script itself
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_SCRIPT_NAME="host.py"
MANIFEST_NAME="$HOST_NAME.json"

# --- Pre-flight checks ---
if [ ! -f "$SRC_DIR/$HOST_SCRIPT_NAME" ]; then
  echo "Error: Host script '$HOST_SCRIPT_NAME' not found in '$SRC_DIR'."
  exit 1
fi
if [ ! -f "$SRC_DIR/$MANIFEST_NAME" ]; then
  echo "Error: Manifest template '$MANIFEST_NAME' not found in '$SRC_DIR'."
  exit 1
fi

# --- Installation ---
echo "Installing The New Fuse native host..."

# 1. Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# 2. Copy the host script and make it executable
cp "$SRC_DIR/$HOST_SCRIPT_NAME" "$DEST_DIR/$HOST_SCRIPT_NAME"
chmod +x "$DEST_DIR/$HOST_SCRIPT_NAME"

# 3. Create a temporary manifest file and update it with the correct paths
MANIFEST_SRC="$SRC_DIR/$MANIFEST_NAME"
MANIFEST_TMP="/tmp/$MANIFEST_NAME"
ABS_PATH_TO_HOST="$DEST_DIR/$HOST_SCRIPT_NAME"

# Use a different delimiter for sed to handle paths with slashes
sed -e "s|/ABSOLUTE/PATH/TO/INSTALLED/host.py|$ABS_PATH_TO_HOST|" \
    -e "s|YOUR_EXTENSION_ID_WILL_GO_HERE|$EXT_ID|" \
    "$MANIFEST_SRC" > "$MANIFEST_TMP"

# 4. Copy the updated manifest to Chrome's and/or Chromium's directory
if [ -d "$CHROME_MANIFEST_DEST" ]; then
    echo "Installing manifest for Google Chrome..."
    cp "$MANIFEST_TMP" "$CHROME_MANIFEST_DEST/$MANIFEST_NAME"
fi

if [ -d "$CHROMIUM_MANIFEST_DEST" ]; then
    echo "Installing manifest for Chromium..."
    cp "$MANIFEST_TMP" "$CHROMIUM_MANIFEST_DEST/$MANIFEST_NAME"
fi

# 5. Clean up the temporary file
rm "$MANIFEST_TMP"

echo "✅ Native host for The New Fuse installed successfully."
echo "Please completely quit and restart Google Chrome for the changes to take effect."