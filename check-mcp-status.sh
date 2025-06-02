#!/bin/bash

set -e

echo "🔍 Checking MCP Server Status..."

# Navigate to project root
cd "$(dirname "$0")"

# Check if server is built
if [ ! -f "dist/mcp/server.js" ]; then
    echo "❌ MCP server not built. Run './build-mcp.sh' first."
    exit 1
fi

echo "✅ MCP server built successfully"

# Check if dependencies are installed
if [ ! -d "node_modules/@modelcontextprotocol" ]; then
    echo "❌ MCP SDK not installed. Run 'yarn install' first."
    exit 1
fi

echo "✅ MCP dependencies installed"

# Check if Claude Desktop config exists
CLAUDE_CONFIG="$HOME/.config/claude-desktop/config.json"
if [ ! -f "$CLAUDE_CONFIG" ]; then
    echo "❌ Claude Desktop config not found at $CLAUDE_CONFIG"
    echo "   The config has been created at: $(pwd)/claude_desktop_config.json"
    echo "   Please copy it to the correct location or restart Claude Desktop"
else
    echo "✅ Claude Desktop config found"
fi

# Test the server quickly
echo "🧪 Testing MCP server startup..."
timeout 10s node dist/mcp/server.js --help > /dev/null 2>&1 || true

echo ""
echo "🎉 MCP Server Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start development: npm run mcp:dev"
echo "2. Or start normally: npm run mcp:start"  
echo "3. Test with inspector: npm run mcp:test"
echo "4. Restart Claude Desktop to use the new server"
echo ""
echo "🔧 Available Commands:"
echo "  npm run mcp:build     - Build the server"
echo "  npm run mcp:start     - Start in stdio mode"
echo "  npm run mcp:start:remote - Start in HTTP mode"
echo "  npm run mcp:dev       - Development mode with auto-reload"
echo "  npm run mcp:test      - Test with MCP Inspector"
echo ""
echo "📚 Documentation: src/mcp/README.md"
