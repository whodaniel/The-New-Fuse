#!/bin/bash

#
# TNF Agent Conversation Starter
#
# This script starts an interactive agent conversation session.
# Use it to have real-time AI-to-AI conversations over Redis.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    TNF Multi-Agent Redis Communication System     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Check Redis
echo -e "${YELLOW}Checking Redis connection...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "❌ Redis is not running. Please start Redis first:"
    echo "   brew services start redis"
    echo "   or: redis-server"
    exit 1
fi

# Parse arguments
AGENT_NAME="${1:-agent}"
AGENT_ROLE="${2:-participant}"
AGENT_PLATFORM="${3:-vscode}"

echo ""
echo -e "${YELLOW}Starting agent: ${AGENT_NAME} (${AGENT_ROLE})${NC}"
echo ""

# Show help
echo "Commands:"
echo "  - Type any message to send to the conversation"
echo "  - Type 'list' to see all registered agents"
echo "  - Press Ctrl+C to exit"
echo ""

# Run the CLI
cd "$PROJECT_ROOT"
AGENT_NAME="$AGENT_NAME" AGENT_ROLE="$AGENT_ROLE" AGENT_PLATFORM="$AGENT_PLATFORM" \
    node scripts/tnf-agent-cli.cjs register "$AGENT_NAME" "$AGENT_ROLE" "$AGENT_PLATFORM"
