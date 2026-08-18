#!/bin/bash
#
# TNF MCP Quick Start Script
# This script helps AI agents get started with the TNF Model Context Protocol
#
# Custom App Link: https://your-app-link.com/mcp
#

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         TNF MCP Client Quick Start Guide                        ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║ Custom App Link: https://your-app-link.com/mcp                    ║"
echo "║ TNF Website: https://thenewfuse.com/                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the TNF repository
if [ ! -f "package.json" ]; then
    echo "⚠️  Warning: This script should be run from the TNF repository root"
    echo "Current directory: $(pwd)"
fi

echo "Step 1: Checking for MCP configuration..."

# Check for MCP config file
if [ -f "data/mcp_config.json" ]; then
    echo "✅ Found MCP configuration file: data/mcp_config.json"
else
    echo "❌ MCP configuration file not found"
    exit 1
fi

echo ""
echo "Step 2: Available MCP servers in configuration:"
echo ""

# Parse and display available MCP servers
if command -v jq &> /dev/null; then
    jq -r '.mcpServers | keys[]' data/mcp_config.json | while read -r server; do
        echo "  • $server"
    done
else
    # Fallback if jq is not available
    grep -o '"[^"]*":' data/mcp_config.json | grep -v "mcpServers\|config\|servers" | head -10 | while read -r server; do
        echo "  • ${server//:/}"
    done
fi

echo ""
echo "Step 3: Starting MCP servers..."
echo ""

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is available"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

echo ""
echo "Step 4: Available MCP server scripts:"
echo ""

# List available MCP server scripts
for script in src/mcp/*.ts; do
    if [ -f "$script" ]; then
        echo "  • $script"
    fi
done

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         Quick Start Complete!                                      ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                     ║"
echo "║ To use TNF MCP from your AI agent, configure your client with:     ║"
echo "║                                                                     ║"
echo "║   Server: tnf-enhanced-mcp-server                                    ║"
echo "║   Command: pnpm exec tsx src/mcp/enhanced-tnf-mcp-server.ts        ║"
echo "║   Tools: list_agents, get_agent_details, get_system_status         ║"
echo "║                                                                     ║"
echo "║ Documentation: docs/MCP_CLIENT_INTEGRATION_GUIDE.md                  ║"
echo "║ Website: https://thenewfuse.com/                                   ║"
echo "║ Custom MCP Link: https://your-app-link.com/mcp                     ║"
echo "║                                                                     ║"
echo "╚══════════════════════════════════════════════════════════════════╝"