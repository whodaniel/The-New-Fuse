#!/bin/bash

set -e

echo "🔨 Building MCP server..."

# Navigate to project root
cd "$(dirname "$0")"

# Create dist directory if it doesn't exist
mkdir -p dist/mcp

# Build the MCP server
echo "Compiling TypeScript..."
npx tsc --project src/mcp/tsconfig.json

# Make the server executable
echo "Making server executable..."
chmod +x dist/mcp/server.js

# Add shebang if not present
if ! head -1 dist/mcp/server.js | grep -q "#!/usr/bin/env node"; then
    sed -i '1i#!/usr/bin/env node' dist/mcp/server.js
fi

echo "✅ MCP server built successfully!"
echo "📍 Location: dist/mcp/server.js"
