#!/bin/bash

# Quick stop script for The New Fuse MCP server
echo "Stopping MCP server..."

# Check if PID file exists
if [ -f "./mcp/server.pid" ]; then
  SERVER_PID=$(cat ./mcp/server.pid)
  
  # Check if process is running
  if ps -p $SERVER_PID > /dev/null; then
    # Kill the process
    kill $SERVER_PID
    echo "✅ MCP server stopped (PID: $SERVER_PID)"
  else
    echo "⚠️ MCP server is not running (PID: $SERVER_PID)"
  fi
  
  # Remove PID file
  rm ./mcp/server.pid
else
  # Try to find and kill any running node process for SimpleMCPServer.js
  SERVER_PID=$(ps aux | grep "[S]impleMCPServer.js" | awk '{print $2}')
  
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID
    echo "✅ MCP server stopped (PID: $SERVER_PID)"
  else
    echo "⚠️ No running MCP server found"
  fi
fi

# Verify server is actually stopped
if curl -s http://localhost:3000/health > /dev/null; then
  echo "⚠️ Warning: MCP server is still responding at http://localhost:3000"
  echo "You may need to manually kill the process"
else
  echo "Confirmed: MCP server is no longer responding at http://localhost:3000"
fi