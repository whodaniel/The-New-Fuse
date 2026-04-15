#!/bin/bash

# TNF Native Messaging Host Installer for macOS

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_NAME="com.thenewfuse.native_host"
HOST_PATH="$SCRIPT_DIR/tnf-native-host.js"
NATIVE_MESSAGING_HOSTS_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

echo "🔧 Installing TNF Native Messaging Host..."

# Create directory if it doesn't exist
mkdir -p "$NATIVE_MESSAGING_HOSTS_DIR"

# Make the host executable
chmod +x "$HOST_PATH"

# Get the extension ID from the user or use placeholder
read -p "Enter your Chrome extension ID (leave blank to configure later): " EXTENSION_ID

if [ -z "$EXTENSION_ID" ]; then
  EXTENSION_ID="YOUR_EXTENSION_ID"
  echo "⚠️  You'll need to update the extension ID later in:"
  echo "   $NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json"
fi

# Create the manifest
cat > "$NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "The New Fuse Native Messaging Host - Controls TNF services from Chrome",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "✅ Native messaging host installed successfully!"
echo ""
echo "📋 Configuration:"
echo "   Host name: $HOST_NAME"
echo "   Host path: $HOST_PATH"
echo "   Manifest:  $NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json"
echo ""
echo "🚀 Next steps:"
echo "   1. Load the Fuse Connect extension in Chrome"
echo "   2. Get the extension ID from chrome://extensions/"
echo "   3. Update the allowed_origins in the manifest with your extension ID"
echo ""
