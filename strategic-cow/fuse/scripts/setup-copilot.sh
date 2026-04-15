#!/bin/bash

# Auto-Setup Copilot CLI
# This script is a wrapper around the installer and basic tests

echo "🛠️  Setting up TNF Copilot CLI..."

# Run installer
if [ -f scripts/install-copilot-cli.sh ]; then
    bash scripts/install-copilot-cli.sh
else
    echo "❌ Installer script not found!"
    exit 1
fi

# Verify execution
CLI_PATH="./tools/copilot-cli.js"
if [ ! -x "$CLI_PATH" ]; then
    chmod +x "$CLI_PATH"
fi

# Check connection to OpenClaw (Frontend)
echo "🔍 Checking OpenClaw connectivity..."
if curl -s http://127.0.0.1:18789/ > /dev/null; then
    echo "✅ OpenClaw frontend reachable (http://127.0.0.1:18789)"

    # Try API (Warning: Likely 405/404 if path is tricky)
    echo "Testing API endpoint compatibility..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:18789/v1/chat/completions)
    if [ "$API_RESPONSE" == "200" ] || [ "$API_RESPONSE" == "405" ]; then
        echo "✅ API reachable (Status: $API_RESPONSE)"
    else
        echo "⚠️  API might be misconfigured or on a different path (Status: $API_RESPONSE)"
        echo "   Please update endpoint in copilot-cli.js or pass --endpoint arg."
    fi
else
    echo "⚠️  OpenClaw not running on port 18789. Please ensure it's started."
fi

echo ""
echo "🎉 Setup complete! Use 'tnf-copilot' alias or run './tools/copilot-cli.js'"
