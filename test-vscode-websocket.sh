#!/bin/bash

# This script tests the VSCode extension's WebSocket server

echo "Testing VSCode extension's WebSocket server..."

# Check if the browser test client exists
if [ -f "browser-test-client.html" ]; then
  echo "Browser test client found at browser-test-client.html"
else
  echo "Error: Browser test client not found. Please make sure you're in the correct directory."
  exit 1
fi

# Check if port 3710 is in use (which it should be if the VSCode extension is running)
if lsof -i :3710 &> /dev/null; then
  echo "Port 3710 is in use. VSCode extension's WebSocket server may be running."
else
  echo "Warning: Port 3710 is not in use. The VSCode extension's WebSocket server may not be running."
  echo "Please make sure the VSCode extension is running and has initialized the WebSocket server."
fi

# Open the browser test client
echo "Opening browser test client..."
open browser-test-client.html

echo ""
echo "Instructions:"
echo "1. In the browser test client, click 'Connect' to establish a WebSocket connection"
echo "2. If the connection is successful, you should see a 'Connected' message"
echo "3. Try sending messages using the interface to test the connection"
echo ""
echo "If the connection fails, please check the following:"
echo "1. Make sure the VSCode extension is running"
echo "2. Make sure the VSCode extension has initialized the WebSocket server"
echo "3. Check the VSCode extension logs for any errors"
echo ""
echo "Done!"
