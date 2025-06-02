#!/bin/bash

set -e

echo "🖥️ Starting The New Fuse MCP Server (stdio mode)..."

# Navigate to project root
cd "$(dirname "$0")"

# Build if needed
if [ ! -f "dist/mcp/server.js" ] || [ "src/mcp/server.ts" -nt "dist/mcp/server.js" ]; then
    echo "Building MCP server..."
    ./build-mcp.sh
fi

# Set environment variables
export NODE_ENV=development
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse
export REDIS_URL=redis://localhost:6379
export LOG_LEVEL=info

# Start the server
node dist/mcp/server.js
