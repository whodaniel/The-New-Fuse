#!/bin/bash

# Quick start script for The New Fuse MCP server
echo "Checking MCP server status..."

# Create required directories
mkdir -p ./mcp/logs

# Check if the server is already running
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ MCP server is already running at http://localhost:3000"
  echo "To stop the server, use: ./quick-stop-mcp.sh"
  exit 0
fi

echo "MCP server is not running. Starting it now..."

# Make sure permissions are correct
chmod +x ./scripts/fix-permissions.sh
./scripts/fix-permissions.sh

# Make our simple server executable
chmod +x ./src/mcp/SimpleMCPServer.js

# Start the server
node ./src/mcp/SimpleMCPServer.js &
SERVER_PID=$!

# Save PID to file for easy stopping later
echo $SERVER_PID > ./mcp/server.pid

# Wait briefly for server to start
sleep 2

# Check if server started successfully
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ MCP server started successfully!"
  echo "Server is running at http://localhost:3000"
  echo "Health endpoint: http://localhost:3000/health"
  echo "API endpoint: http://localhost:3000/api/agents"
  echo "To stop the server, use: ./quick-stop-mcp.sh"
else
  echo "❌ Failed to start MCP server"
  echo "Check logs in ./mcp/logs/ for more information"
fi