#!/bin/bash

# Install script for The New Fuse Native Host (macOS/Linux)

echo "🔧 Installing The New Fuse Native Host..."

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_SCRIPT="$SCRIPT_DIR/host.py"
INSTALL_DIR="/usr/local/bin"
MANIFEST_FILE="$SCRIPT_DIR/com.thenewfuse.nativehost.json"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check and install required Python packages
echo "📦 Checking Python dependencies..."

# Check for psutil
if ! python3 -c "import psutil" &> /dev/null; then
    echo "Installing psutil..."
    pip3 install psutil || {
        echo "❌ Failed to install psutil. Please install it manually:"
        echo "pip3 install psutil"
        exit 1
    }
fi

# Check for pyautogui
if ! python3 -c "import pyautogui" &> /dev/null; then
    echo "Installing pyautogui..."
    pip3 install pyautogui || {
        echo "❌ Failed to install pyautogui. Please install it manually:"
        echo "pip3 install pyautogui"
        exit 1
    }
fi

echo "✅ Python dependencies satisfied"

# Make host script executable
chmod +x "$HOST_SCRIPT"

# Create wrapper script in /usr/local/bin
echo "📝 Creating native host wrapper..."

sudo tee "$INSTALL_DIR/tnf-native-host" > /dev/null << EOF
#!/bin/bash
exec python3 "$HOST_SCRIPT" "\$@"
EOF

sudo chmod +x "$INSTALL_DIR/tnf-native-host"

echo "✅ Native host installed to $INSTALL_DIR/tnf-native-host"

# Install manifest for Chrome (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    CHROME_MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    mkdir -p "$CHROME_MANIFEST_DIR"
    
    # Update manifest with correct path
    sed "s|/usr/local/bin/tnf-native-host|$INSTALL_DIR/tnf-native-host|g" "$MANIFEST_FILE" > "$CHROME_MANIFEST_DIR/com.thenewfuse.nativehost.json"
    
    echo "✅ Chrome manifest installed for macOS"
    
    # Also install for Chromium if it exists
    CHROMIUM_MANIFEST_DIR="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
    if [ -d "$HOME/Library/Application Support/Chromium" ]; then
        mkdir -p "$CHROMIUM_MANIFEST_DIR"
        cp "$CHROME_MANIFEST_DIR/com.thenewfuse.nativehost.json" "$CHROMIUM_MANIFEST_DIR/"
        echo "✅ Chromium manifest installed for macOS"
    fi

# Install manifest for Chrome (Linux)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CHROME_MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    mkdir -p "$CHROME_MANIFEST_DIR"
    
    # Update manifest with correct path
    sed "s|/usr/local/bin/tnf-native-host|$INSTALL_DIR/tnf-native-host|g" "$MANIFEST_FILE" > "$CHROME_MANIFEST_DIR/com.thenewfuse.nativehost.json"
    
    echo "✅ Chrome manifest installed for Linux"
    
    # Also install for Chromium if it exists
    CHROMIUM_MANIFEST_DIR="$HOME/.config/chromium/NativeMessagingHosts"
    if [ -d "$HOME/.config/chromium" ]; then
        mkdir -p "$CHROMIUM_MANIFEST_DIR"
        cp "$CHROME_MANIFEST_DIR/com.thenewfuse.nativehost.json" "$CHROMIUM_MANIFEST_DIR/"
        echo "✅ Chromium manifest installed for Linux"
    fi
fi

echo ""
echo "🎉 The New Fuse Native Host installation complete!"
echo ""
echo "📋 Installation Summary:"
echo "   • Native host script: $HOST_SCRIPT"
echo "   • System executable: $INSTALL_DIR/tnf-native-host"
echo "   • Chrome manifest: Installed for current user"
echo ""
echo "🔄 Next Steps:"
echo "   1. Restart Chrome/Chromium browsers"
echo "   2. Run The New Fuse Electron app"
echo "   3. Test native commands in the Local Services tab"
echo ""
echo "🧪 Test the installation:"
echo "   echo '{\"id\":\"test\",\"command\":\"check_system\",\"args\":[]}' | $INSTALL_DIR/tnf-native-host"
echo ""
