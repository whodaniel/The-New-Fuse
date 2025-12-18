#!/bin/bash

# This script starts the VSCode extension's WebSocket server for testing

echo "Starting VSCode extension WebSocket server..."

# Check if the VSCode extension is already running
if lsof -i :3710 &> /dev/null; then
  echo "Port 3710 is already in use. The VSCode extension's WebSocket server may already be running."
  echo "You can proceed with testing."
else
  echo "Port 3710 is not in use. The VSCode extension's WebSocket server is not running."
  echo "Please start the VSCode extension first."
  
  # Provide instructions for starting the VSCode extension
  echo ""
  echo "To start the VSCode extension:"
  echo "1. Open VSCode"
  echo "2. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P)"
  echo "3. Type 'The New Fuse: Start WebSocket Server' and press Enter"
  echo ""
  echo "Alternatively, you can run the test WebSocket server on port 3710:"
  echo "node test-websocket-server.cjs"
  
  exit 1
fi

echo ""
echo "To test the WebSocket server, run:"
echo "node test-vscode-extension-websocket.js"
echo ""
echo "This will send various message types to the WebSocket server and display the responses."
