#!/bin/bash

# Build and Launch Frontend with pnpm
# This script builds the React frontend and launches it using pnpm

set -e

echo "🚀 Building and launching The New Fuse Frontend with pnpm..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

echo -e "${BLUE}📁 Project root: $PROJECT_ROOT${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first:${NC}"
    echo "npm install -g pnpm"
    exit 1
fi

echo -e "${GREEN}✅ pnpm version: $(pnpm --version)${NC}"

# Navigate to frontend directory
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Frontend directory: $FRONTEND_DIR${NC}"

# Install dependencies with pnpm
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$PROJECT_ROOT"
pnpm install

# Build the frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd "$FRONTEND_DIR"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Check if build directory exists
BUILD_DIR="$FRONTEND_DIR/dist"
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $BUILD_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build artifacts found in: $BUILD_DIR${NC}"

# Start the pnpm server
echo -e "${YELLOW}🌐 Starting pnpm server...${NC}"
cd "$PROJECT_ROOT"

# Kill any existing server on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the server in background
echo -e "${BLUE}🚀 Launching server with Bun...${NC}"
pnpm run bun-server.ts &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Server started successfully (PID: $SERVER_PID)${NC}"
    echo -e "${GREEN}🌐 Frontend available at: http://localhost:3001${NC}"
    echo -e "${GREEN}📱 Static showcase at: http://localhost:3001/static/${NC}"
    
    # Open in Chrome if available
    if command -v open &> /dev/null; then
        echo -e "${BLUE}🌍 Opening in Chrome...${NC}"
        sleep 1
        open -a "Google Chrome" "http://localhost:3001"
    elif command -v google-chrome &> /dev/null; then
        echo -e "${BLUE}🌍 Opening in Chrome...${NC}"
        sleep 1
        google-chrome "http://localhost:3001"
    else
        echo -e "${YELLOW}⚠️  Chrome not found. Please open http://localhost:3001 manually${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Frontend launched successfully!${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
    
    # Wait for server to finish or be interrupted
    wait $SERVER_PID
else
    echo -e "${RED}❌ Failed to start server${NC}"
    exit 1
fi
