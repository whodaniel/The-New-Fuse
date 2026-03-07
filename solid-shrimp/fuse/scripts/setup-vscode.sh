#!/bin/bash
# VS Code Proxy Configuration Generator

TNF_PROXY_PORT=8888

echo "🔧 Generating VS Code proxy configuration..."

# Create config directory if it doesn't exist
mkdir -p "$(dirname "$0")/../config"

# Generate VS Code settings
cat > "$(dirname "$0")/../config/vscode-proxy-settings.json" << EOF
{
    "http.proxy": "http://localhost:$TNF_PROXY_PORT",
    "http.proxyStrictSSL": false,
    "http.proxySupport": "on",
    "http.systemCertificates": false
}
EOF

echo "✅ VS Code proxy configuration generated"
echo "📁 Config file: $(dirname "$0")/../config/vscode-proxy-settings.json"
echo ""
echo "📋 To apply:"
echo "1. Open VS Code"
echo "2. Go to Settings (Cmd+,)"
echo "3. Click 'Open Settings (JSON)' in the top-right"
echo "4. Add the contents from vscode-proxy-settings.json"
echo ""
echo "Or copy to clipboard:"
cat "$(dirname "$0")/../config/vscode-proxy-settings.json"