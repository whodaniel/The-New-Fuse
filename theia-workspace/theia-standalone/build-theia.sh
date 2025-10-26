#!/bin/bash

# Theia Build Wrapper
# Handles Node.js version requirements and builds Theia IDE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Theia IDE Build System${NC}"
echo -e "${BLUE}═══════════════════════════${NC}"

# Auto-switch to compatible Node version if using nvm
echo -e "${BLUE}🔧 Checking Node.js version for Theia compatibility...${NC}"

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"

    # Try to switch to Node 20 if available
    if nvm list | grep -q "v20"; then
        echo -e "${BLUE}✅ Switching to Node.js v20 for Theia build...${NC}"
        nvm use 20
    # Fallback to Node 18 if available
    elif nvm list | grep -q "v18"; then
        echo -e "${BLUE}✅ Switching to Node.js v18 for Theia build...${NC}"
        nvm use 18
    else
        echo -e "${YELLOW}⚠️  No compatible Node.js version found (need v18 or v20)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nvm not found - manual Node.js version management required${NC}"
fi

# Check current Node version after potential switch
CURRENT_NODE=$(node -v)
NODE_MAJOR=$(echo $CURRENT_NODE | cut -d'.' -f1 | sed 's/v//')

echo -e "${BLUE}📊 Using Node.js version: ${CURRENT_NODE}${NC}"

# Check if Node version is compatible
if [ "$NODE_MAJOR" -ge 21 ]; then
    echo -e "${RED}❌ Theia v1.59.0 requires Node.js >= 18.17.0 and < 21${NC}"
    echo -e "${RED}   Current version: ${CURRENT_NODE}${NC}"
    echo ""
    echo -e "${YELLOW}To fix this issue:${NC}"
    echo -e "${YELLOW}1. Install compatible Node: nvm install 20${NC}"
    echo -e "${YELLOW}2. Use it for Theia: nvm use 20${NC}"
    echo -e "${YELLOW}3. Then run this script again${NC}"
    echo ""

    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Build cancelled - Node version incompatible${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js version is compatible with Theia v1.59.0${NC}"
fi

# Determine build mode
BUILD_MODE="development"
if [[ "$1" == "--prod" ]] || [[ "$1" == "build" ]]; then
    BUILD_MODE="production"
fi

echo -e "${BLUE}📦 Build Mode: ${BUILD_MODE}${NC}"

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}📦 Yarn not found. Installing yarn...${NC}"
    npm install -g yarn
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies with yarn...${NC}"
    yarn install --frozen-lockfile
fi

# Run the appropriate build command
echo -e "${BLUE}🏗️  Starting Theia build...${NC}"

if [ "$BUILD_MODE" == "production" ]; then
    echo -e "${BLUE}⚡ Building for production...${NC}"

    # Set environment variables for optimization
    export NODE_OPTIONS="--max_old_space_size=8192"
    export BUILD_CONCURRENCY="2"

    # Use conditional commands to handle different build scenarios
    # Try multiple approaches to avoid package manager conflicts
    if [ -f "./node_modules/.bin/theia" ]; then
        echo -e "${BLUE}🔧 Using local Theia CLI...${NC}"
        ./node_modules/.bin/theia build --mode production
    elif command -v npx &> /dev/null; then
        echo -e "${BLUE}🔧 Using npx to run Theia...${NC}"
        npx @theia/cli@1.59.0 build --mode production
    elif command -v theia &> /dev/null; then
        echo -e "${BLUE}🔧 Using global Theia CLI...${NC}"
        theia build --mode production
    else
        echo -e "${RED}❌ No Theia CLI found. Installing...${NC}"
        npm install -g @theia/cli@1.59.0
        theia build --mode production
    fi
else
    echo -e "${BLUE}🔧 Starting development server...${NC}"
    if [ -f "./node_modules/.bin/theia" ]; then
        ./node_modules/.bin/theia start --hostname=0.0.0.0 --port=3000
    elif command -v theia &> /dev/null; then
        theia start --hostname=0.0.0.0 --port=3000
    else
        echo -e "${RED}❌ No Theia CLI found for dev mode${NC}"
        exit 1
    fi
fi

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Theia build completed successfully!${NC}"

    if [ "$BUILD_MODE" == "production" ]; then
        echo -e "${GREEN}📦 Built files are available in the lib/ directory${NC}"
        echo -e "${GREEN}🚀 To start the production server: yarn start${NC}"
    else
        echo -e "${GREEN}🌐 Development server should be running on http://localhost:3000${NC}"
    fi
else
    echo -e "${RED}❌ Theia build failed!${NC}"
    echo -e "${YELLOW}💡 Try the following:${NC}"
    echo -e "${YELLOW}   1. Check Node.js version compatibility${NC}"
    echo -e "${YELLOW}   2. Clear node_modules: rm -rf node_modules && yarn install${NC}"
    echo -e "${YELLOW}   3. Increase memory: export NODE_OPTIONS=\"--max_old_space_size=8192\"${NC}"
    exit 1
fi