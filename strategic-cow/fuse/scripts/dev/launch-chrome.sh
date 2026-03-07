#!/bin/bash

# Launch Chrome with The New Fuse Frontend
echo "🚀 Launching The New Fuse Frontend in Chrome..."

# Check if the server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "⚠️  Server not running. Starting Bun server..."
    bun bun-server.ts &
    sleep 2
fi

# Open Chrome with the frontend
if command -v google-chrome &> /dev/null; then
    google-chrome http://localhost:3001
elif command -v google-chrome-stable &> /dev/null; then
    google-chrome-stable http://localhost:3001
elif command -v chromium &> /dev/null; then
    chromium http://localhost:3001
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open -a "Google Chrome" http://localhost:3001
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3001
else
    echo "🌐 Please open http://localhost:3001 in your browser"
fi

echo "✅ Frontend launched successfully!"
echo "📍 URL: http://localhost:3001"
