#!/bin/bash

# Start the MCP server for The New Fuse
echo "Starting MCP server..."

# Check environment variables
if [ -z "$PORT" ]; then
  PORT=3000
  echo "Using default port: $PORT"
fi

# Create logs directory if it doesn't exist
mkdir -p ./mcp/logs

# Start the server with appropriate parameters
echo "Starting MCP server on port $PORT"
node ./src/mcp/SimpleMCPServer.js --port $PORT > ./mcp/logs/mcp-server.log 2>&1 &
PID=$!

echo "MCP server started with PID: $PID"
echo $PID > ./mcp/mcp-server.pid

# Wait briefly to check if the server started successfully
sleep 3
if ps -p $PID > /dev/null; then
  echo "✓ MCP server is running"
  echo "Logs available at: ./mcp/logs/mcp-server.log"
else
  echo "✗ Failed to start MCP server. Check logs at: ./mcp/logs/mcp-server.log"
  exit 1
fi