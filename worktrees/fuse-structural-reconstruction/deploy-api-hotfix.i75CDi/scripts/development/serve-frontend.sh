#!/bin/bash

# Quick Frontend Server with Bun
# This script starts the Bun server assuming the frontend is already built

set -e

echo "🚀 Starting The New Fuse Frontend Server with Bun..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install Bun first:${NC}"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Kill any existing server on port 3001
echo -e "${YELLOW}🔄 Checking for existing servers...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Navigate to project root
cd "$PROJECT_ROOT"

# Check if frontend is built
BUILD_DIR="$PROJECT_ROOT/apps/frontend/dist"
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}⚠️  Frontend not built yet. Building now...${NC}"
    cd "$PROJECT_ROOT/apps/frontend"
    pnpm run build
    cd "$PROJECT_ROOT"
fi

echo -e "${GREEN}✅ Frontend build found${NC}"

# Start the server
echo -e "${BLUE}🌐 Starting Bun server on http://localhost:3001${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Set environment variables
export NODE_ENV=development
export PORT=3001
export HOST=localhost

# Start the server
pnpm run bun-server.ts
