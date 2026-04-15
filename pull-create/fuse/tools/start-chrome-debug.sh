#!/bin/bash

echo "🚀 Starting Chrome with Remote Debugging"
echo "========================================"

# Kill any existing Chrome processes
echo "1. Killing existing Chrome processes..."
pkill -f "Google Chrome" 2>/dev/null || true
sleep 2

# Create debug directory
echo "2. Creating debug directory..."
mkdir -p /tmp/chrome-debug

# Start Chrome with debugging
echo "3. Starting Chrome with debugging on port 9222..."
nohup /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  --disable-extensions \
  --disable-plugins \
  --disable-popup-blocking \
  --disable-translate \
  --user-data-dir=/tmp/chrome-debug \
  > /tmp/chrome-debug.log 2>&1 &

echo "4. Waiting for Chrome to start..."
sleep 5

# Test debugging connection
echo "5. Testing debugging connection..."
if curl -s http://localhost:9222/json/version > /dev/null; then
    echo "✅ SUCCESS: Chrome debugging port is accessible"
    echo "Debug URL: http://localhost:9222"
    echo "Version: $(curl -s http://localhost:9222/json/version 2>/dev/null | grep -o '"Browser":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ FAILED: Chrome debugging port not accessible"
    echo "Check logs: /tmp/chrome-debug.log"
    echo "Manual command:"
    echo "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug &"
fi

echo
echo "Chrome Debug Status:"
echo "==================="
lsof -i :9222 2>/dev/null || echo "No process listening on port 9222"