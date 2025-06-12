#!/bin/bash

# Open all test pages in Chrome for The New Fuse
echo "🌐 Opening all test pages in Chrome..."

# Array of URLs to open
urls=(
    "http://localhost:3000"                    # Frontend
    "http://localhost:3001"                    # API Server
    "http://localhost:3001/api/health"         # Health Check
    "http://localhost:3001/api/docs"           # API Documentation
    "http://localhost:3002"                    # Message Broker (if running)
    "chrome://extensions/"                     # Chrome Extensions page
    "http://localhost:3000/dashboard"          # Dashboard (if exists)
    "http://localhost:3000/agents"             # Agents page (if exists)
    "http://localhost:3000/monitoring"         # Monitoring page (if exists)
    "http://localhost:6379"                    # Redis (if web interface)
)

# Open each URL in a new Chrome tab
for url in "${urls[@]}"; do
    echo "Opening: $url"
    open -a "Google Chrome" "$url"
    sleep 1  # Small delay to prevent overwhelming Chrome
done

echo "✅ All test pages opened in Chrome!"
echo ""
echo "📋 Pages opened:"
echo "• Frontend: http://localhost:3000"
echo "• API Server: http://localhost:3001"
echo "• API Health: http://localhost:3001/api/health"
echo "• API Docs: http://localhost:3001/api/docs"
echo "• Chrome Extensions: chrome://extensions/"
echo ""
echo "🔧 To install Chrome Extension:"
echo "1. Go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select: chrome-extension/dist/ folder"
echo ""
echo "🔧 To install VS Code Extension:"
echo "1. Open VS Code"
echo "2. Go to Extensions view (Ctrl+Shift+X)"
echo "3. Click '...' menu → Install from VSIX"
echo "4. Select: src/vscode-extension/the-new-fuse-*.vsix"
