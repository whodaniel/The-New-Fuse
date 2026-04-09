#!/bin/bash
# Quick setup script to add Node to PATH and verify installation

echo "🔍 Searching for Node.js installation..."

# Common Node.js locations
NODE_PATHS=(
    "/usr/local/bin/node"
    "/opt/homebrew/bin/node"
    "/usr/local/opt/node@22/bin/node"
    "/usr/local/opt/node/bin/node"
    "$HOME/.nvm/versions/node/*/bin/node"
)

FOUND_NODE=""

for NODE_PATH in "${NODE_PATHS[@]}"; do
    if [ -f "$NODE_PATH" ] || compgen -G "$NODE_PATH" > /dev/null 2>&1; then
        FOUND_NODE=$(echo $NODE_PATH | head -1)
        break
    fi
done

if [ -n "$FOUND_NODE" ]; then
    NODE_DIR=$(dirname "$FOUND_NODE")
    echo "✅ Found Node.js at: $FOUND_NODE"
    echo ""
    export PATH="$NODE_DIR:$PATH"
    echo "📝 Updated PATH for this session"
    echo ""
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
    echo "To make this permanent, add to your ~/.zshrc:"
    echo "export PATH=\"$NODE_DIR:\$PATH\""
else
    echo "❌ Node.js not found in common locations"
    echo ""
    echo "Please install Node.js:"
    echo "  brew install node@22"
    echo ""
    echo "Or if you already installed it, please specify the location"
    exit 1
fi
