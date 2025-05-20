#!/bin/bash

# This script runs the test WebSocket server

echo "Starting test WebSocket server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found. Please install Node.js first."
  exit 1
fi

# Check if the test server file exists
if [ -f "test-websocket-server.cjs" ]; then
  echo "Test server file found at test-websocket-server.cjs"
else
  echo "Error: Test server file not found. Please make sure you're in the correct directory."
  exit 1
fi

# Check if port 3710 is already in use
if lsof -i :3710 &> /dev/null; then
  echo "Warning: Port 3710 is already in use. The server may not start properly."
  echo "You may need to stop the existing process using port 3710 first."
fi

# Run the test server
echo "Running test WebSocket server on port 3710..."
node test-websocket-server.cjs

echo "Server stopped."
