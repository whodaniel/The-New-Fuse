#!/bin/bash

# MCP Browser Hub Launcher
# Launches the MCP browser hub server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Launching MCP Browser Hub...${NC}"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to browser hub directory
cd "$PROJECT_ROOT/apps/browser-hub"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 14+ to continue.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 14 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 14+.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if port is already in use
PORT=${PORT:-8080}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use. Trying port $((PORT + 1))...${NC}"
    export PORT=$((PORT + 1))
fi

echo -e "${GREEN}✅ Starting MCP Browser Hub server...${NC}"
echo -e "${GREEN}🌐 The browser hub will be available at: http://localhost:${PORT:-8080}${NC}"
echo -e "${GREEN}📁 Serving files from: $(pwd)${NC}"
echo -e "${GREEN}🔄 Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server
npm start