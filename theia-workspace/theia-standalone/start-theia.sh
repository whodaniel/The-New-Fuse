#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Theia IDE${NC}"
echo ""

# Check if nvm is available
if [ -z "$NVM_DIR" ]; then
    export NVM_DIR="$HOME/.nvm"
fi

# Load nvm
if [ -s "$NVM_DIR/nvm.sh" ]; then
    echo -e "${BLUE}📦 Loading nvm...${NC}"
    source "$NVM_DIR/nvm.sh"
else
    echo -e "${RED}❌ nvm not found!${NC}"
    echo "Please install nvm or switch to Node.js 20 manually"
    exit 1
fi

# Check current Node version
CURRENT_NODE=$(node --version)
echo -e "${BLUE}📊 Current Node.js version: ${CURRENT_NODE}${NC}"

# Switch to Node 20
echo -e "${BLUE}🔄 Switching to Node.js 20...${NC}"
nvm use 20

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to switch to Node.js 20${NC}"
    echo "Please run: nvm install 20"
    exit 1
fi

NEW_NODE=$(node --version)
echo -e "${GREEN}✓ Now using Node.js ${NEW_NODE}${NC}"
echo ""

# Start Theia
echo -e "${BLUE}🚀 Starting Theia IDE server...${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the theia-ide directory and start the server
cd "$SCRIPT_DIR"
node enhanced-server.js
