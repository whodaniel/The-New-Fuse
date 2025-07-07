#!/bin/bash

set -e

echo "🔨 Building The New Fuse MCP Server..."

# Navigate to project root
cd "$(dirname "$0")"

# Create dist directory if it doesn't exist
mkdir -p dist/mcp

# Build the MCP server with bun
echo "📦 Compiling TypeScript with bun..."
bun build src/mcp/server.ts --outdir dist/mcp --target node --format esm

# Copy any necessary files
if [ -f "src/mcp/package.json" ]; then
    cp src/mcp/package.json dist/mcp/
fi

echo "✅ MCP Server build complete!"
echo "📁 Output: dist/mcp/server.js"
