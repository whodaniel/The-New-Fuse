#!/bin/bash

set -e

echo "🧪 Testing MCP server functionality..."

# Navigate to project root
cd "$(dirname "$0")"

# Build if needed
if [ ! -f "dist/mcp/server.js" ]; then
    echo "Building MCP server..."
    ./build-mcp.sh
fi

# Test with MCP Inspector
echo "Testing with MCP Inspector..."
npx @modelcontextprotocol/inspector dist/mcp/server.js

echo "✅ MCP server test completed!"
