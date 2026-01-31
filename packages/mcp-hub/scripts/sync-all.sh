#!/bin/bash
# Unified MCP Configuration Sync
# Syncs MCP configurations across all AI clients

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_DIR="$(dirname "$SCRIPT_DIR")"
GENERATOR="$SCRIPT_DIR/generate-configs.js"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Unified MCP Configuration Sync                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Parse arguments
PROFILE="${1:-core}"
CLIENTS="${@:2}"

if [ -z "$CLIENTS" ]; then
    CLIENTS="--all"
fi

echo -e "${YELLOW}Profile:${NC} $PROFILE"
echo -e "${YELLOW}Clients:${NC} $CLIENTS"
echo ""

# Run the generator
echo -e "${GREEN}Generating configurations...${NC}"
node "$GENERATOR" "$PROFILE" $CLIENTS

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Sync complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Desktop"
echo "  2. Restart Gemini CLI (close and reopen terminal)"
echo "  3. Reload any VS Code/Cursor windows"
echo ""
echo "To verify, run: /mcp in any Claude session"
