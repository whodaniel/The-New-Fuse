#!/bin/bash

# Helper script to set up and run The New Fuse Chrome extension with WebSocket server

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Ensure we're in the extension directory
cd "$SCRIPT_DIR"

# Check if ws module is installed
if ! npm list ws > /dev/null 2>&1; then
  echo "Installing WebSocket module..."
  npm install ws
fi

# Function to check if a port is in use
function is_port_in_use() {
  if lsof -i :$1 > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Check if port 8080 is already in use
if is_port_in_use 8080; then
  echo "Port 8080 is already in use. Please free up the port or modify the WebSocket server port."
  exit 1
fi

# Build the extension first
echo "Building the Chrome extension..."
./build.sh

# Start the WebSocket server in the background
echo "Starting WebSocket server on ws://localhost:8080..."
node test-websocket-server.js &
WS_SERVER_PID=$!

# Wait a moment to ensure the server starts
sleep 2

# Print instructions
echo ""
echo "=== The New Fuse Chrome Extension Setup ==="
echo ""
echo "WebSocket server is now running on port 8080 (PID: $WS_SERVER_PID)"
echo "Chrome extension has been built and is ready to use."
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top-right corner"
echo "3. Click 'Load unpacked' and select the 'dist' directory in this folder:"
echo "   $SCRIPT_DIR/dist"
echo "4. The extension icon should appear in your browser toolbar"
echo "5. Click on the icon to test the popup UI"
echo ""
echo "To stop the WebSocket server, press CTRL+C"
echo ""

# Trap Ctrl+C to properly shut down the WebSocket server
trap 'echo "Shutting down WebSocket server..."; kill $WS_SERVER_PID; echo "Done."; exit 0' INT

# Keep the script running until terminated
echo "Server is running. Press CTRL+C to exit."
wait $WS_SERVER_PID
