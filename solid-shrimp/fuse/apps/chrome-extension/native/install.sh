#!/bin/bash
set -e

INSTALL_DIR="$HOME/.config/thenewfuse"
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

mkdir -p "$INSTALL_DIR"
cp host.py "$INSTALL_DIR/host.py"
chmod +x "$INSTALL_DIR/host.py"

# Update manifest with correct path
sed "s|/absolute/path/to/host.py|$INSTALL_DIR/host.py|" com.your_company.thenewfuse.json > "$INSTALL_DIR/com.your_company.thenewfuse.json"

mkdir -p "$MANIFEST_DIR"
cp "$INSTALL_DIR/com.your_company.thenewfuse.json" "$MANIFEST_DIR/"

echo "Native host installed. You may need to restart Chrome."
