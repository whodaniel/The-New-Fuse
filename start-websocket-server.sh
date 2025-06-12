#!/bin/bash

# This script starts the WebSocket server for The New Fuse Chrome extension

echo "Starting WebSocket server for The New Fuse Chrome extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to run the WebSocket server."
  exit 1
fi

# Check if the WebSocket server file exists
if [ ! -f "test-websocket-server-3710.cjs" ]; then
  echo "Error: WebSocket server file (test-websocket-server-3710.cjs) not found."
  exit 1
fi

# Check if port 3710 is already in use
if lsof -i :3710 &> /dev/null; then
  echo "Warning: Port 3710 is already in use. Another process might be using it, or the server is already running."
fi

# Start the WebSocket server
echo "Attempting to start WebSocket server on port 3710..."
node test-websocket-server-3710.cjs
