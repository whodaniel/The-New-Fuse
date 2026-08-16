#!/bin/bash
# TNF Native Messaging Host Installer for macOS (non-interactive)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_NAME="com.thenewfuse.native_host"
HOST_JS="$SCRIPT_DIR/tnf-native-host.cjs"
HOST_SH="$SCRIPT_DIR/tnf-native-host.sh"
# Fixed ID from apps/chrome-extension manifest key
EXTENSION_ID="${1:-fkbcklmcikdhpggaimfhomgncneppkbj}"

NATIVE_MESSAGING_HOSTS_DIRS=(
  "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
  "$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"
)

echo "🔧 Installing TNF Native Messaging Host..."

chmod +x "$HOST_JS" "$HOST_SH"

for NATIVE_MESSAGING_HOSTS_DIR in "${NATIVE_MESSAGING_HOSTS_DIRS[@]}"; do
  mkdir -p "$NATIVE_MESSAGING_HOSTS_DIR"
  cat > "$NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "Fuse Connect v7 - Controls TNF services from Chrome Extension",
  "path": "$HOST_SH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF
  echo "   ✅ Registered: $NATIVE_MESSAGING_HOSTS_DIR/$HOST_NAME.json"
done

echo ""
echo "✅ Native messaging host installed"
echo "   Launcher: $HOST_SH"
echo "   Script:   $HOST_JS"
echo "   Origin:   chrome-extension://$EXTENSION_ID/"
echo ""
echo "Reload Fuse Connect in chrome://extensions after install."
