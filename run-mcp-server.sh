#!/bin/bash

# This script runs the MCP server

echo "🖥️ Starting the MCP server..."

# Navigate to the MCP package
cd "$(dirname "$0")/packages/mcp"

# Run the MCP server
echo "Starting MCP server..."
npm run start

echo "MCP server stopped"
