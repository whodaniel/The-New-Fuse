#!/bin/bash

# Start Chrome for debugging
# This script starts Chrome with remote debugging enabled on port 9222

echo "🚀 Starting Chrome with remote debugging..."

# Start Chrome with debugging flags
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --user-data-dir="/tmp/chrome-debug-$(date +%s)" \
  --new-window \
  http://localhost:3000 &

# Wait a moment for Chrome to start
sleep 3

# Check if Chrome is running with debugging
if lsof -i :9222 > /dev/null 2>&1; then
    echo "✅ Chrome started successfully with remote debugging on port 9222"
    echo "🔗 You can now attach VS Code debugger to Chrome"
    echo "📱 Chrome should open at http://localhost:3000"
    
    # Show debugging targets
    echo ""
    echo "📋 Available debugging targets:"
    curl -s http://localhost:9222/json/list | python3 -m json.tool 2>/dev/null || echo "Could not fetch targets (make sure your app is running)"
else
    echo "❌ Failed to start Chrome with debugging"
    echo "💡 Make sure Google Chrome is installed in /Applications/"
fi
