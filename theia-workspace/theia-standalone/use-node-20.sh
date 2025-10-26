#!/bin/bash

# Simple Node.js version switcher for Theia
# Usage: source use-node-20.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Node.js Version Manager for Theia${NC}"

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
    echo -e "${RED}❌ nvm not found. Please install nvm first.${NC}"
    return 1 2>/dev/null || exit 1
fi

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Check if Node 20 is installed
if ! nvm list | grep -q "v20"; then
    echo -e "${YELLOW}📦 Node.js v20 not found. Installing...${NC}"
    nvm install 20
fi

# Switch to Node 20
echo -e "${BLUE}🔄 Switching to Node.js v20...${NC}"
nvm use 20

# Verify the switch
CURRENT_NODE=$(node -v)
echo -e "${GREEN}✅ Now using Node.js ${CURRENT_NODE}${NC}"

# Reminder about reverting
echo -e "${YELLOW}💡 To switch back to your default Node version later:${NC}"
echo -e "${YELLOW}   nvm use default${NC}"
echo ""
echo -e "${BLUE}🏗️ Ready to build Theia! Run: ./build-theia.sh --prod${NC}"