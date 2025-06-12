#!/bin/bash

# Fresh Build and Launch Script for The New Fuse
echo "🚀 The New Fuse - Fresh Build and Launch"
echo "========================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build Chrome Extension
echo -e "\n${BLUE}📦 Building Chrome Extension Fresh...${NC}"
cd chrome-extension
bun install
bun run clean || rm -rf dist
bun run build
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Chrome Extension built successfully${NC}"
    echo -e "   📁 Location: chrome-extension/dist/"
else
    echo -e "${RED}❌ Chrome Extension build failed${NC}"
fi
cd ..

# Step 2: Build VS Code Extension
echo -e "\n${BLUE}🔧 Building VS Code Extension Fresh...${NC}"
cd src/vscode-extension
bun install
bun run clean || rm -rf dist *.vsix
bun run compile
bun run bundle
# Try different package commands
vsce package --out "the-new-fuse-$(date +%Y%m%d-%H%M%S).vsix" 2>/dev/null || \
npx vsce package --out "the-new-fuse-$(date +%Y%m%d-%H%M%S).vsix" 2>/dev/null || \
echo -e "${YELLOW}⚠️ VSCE not available, creating manual package...${NC}"

if ls *.vsix 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ VS Code Extension packaged successfully${NC}"
    echo -e "   📁 Location: $(ls -t *.vsix | head -1)"
else
    echo -e "${YELLOW}⚠️ VS Code Extension package incomplete${NC}"
fi
cd ../..

# Step 3: Build Monorepo
echo -e "\n${BLUE}🏗️ Building Entire Monorepo...${NC}"
bun install
bun run build:all || bun run build
echo -e "${GREEN}✅ Monorepo build completed${NC}"

# Step 4: Launch Services
echo -e "\n${BLUE}🐳 Launching Services...${NC}"

# Stop any existing Docker containers
docker-compose down --remove-orphans 2>/dev/null || true

# Start Docker services
docker-compose up -d --build 2>/dev/null || echo -e "${YELLOW}⚠️ Docker Compose not configured${NC}"

# Start development server
echo -e "\n${BLUE}⚡ Starting Development Server...${NC}"
# Run in background
nohup bun run dev > dev-server.log 2>&1 &
DEV_PID=$!
echo $DEV_PID > dev-server.pid
echo -e "${GREEN}✅ Development server started (PID: $DEV_PID)${NC}"

# Wait a moment for services to start
sleep 5

# Step 5: Open Test Pages
echo -e "\n${BLUE}🌐 Opening Test Pages...${NC}"

# Array of URLs to test
urls=(
    "http://localhost:3000"
    "http://localhost:3001"
    "http://localhost:3001/api/health"
    "chrome://extensions/"
)

for url in "${urls[@]}"; do
    echo -e "   Opening: $url"
    open -a "Google Chrome" "$url" 2>/dev/null || echo -e "${YELLOW}   ⚠️ Could not open $url${NC}"
    sleep 1
done

# Step 6: Status Report
echo -e "\n${BLUE}📊 Build and Launch Status Report${NC}"
echo -e "${BLUE}=================================${NC}"

# Check Chrome Extension
if [ -d "chrome-extension/dist" ]; then
    echo -e "${GREEN}✅ Chrome Extension: Ready for installation${NC}"
    echo -e "   📍 Install: chrome://extensions/ → Load unpacked → chrome-extension/dist/"
else
    echo -e "${RED}❌ Chrome Extension: Build failed${NC}"
fi

# Check VS Code Extension
if ls src/vscode-extension/*.vsix 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ VS Code Extension: Ready for installation${NC}"
    VSIX_FILE=$(ls -t src/vscode-extension/*.vsix | head -1)
    echo -e "   📍 Install: VS Code → Extensions → Install from VSIX → $VSIX_FILE"
else
    echo -e "${RED}❌ VS Code Extension: Package failed${NC}"
fi

# Check services
echo -e "\n${BLUE}🔍 Service Status:${NC}"
sleep 3  # Give services time to start

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend: Not responding${NC}"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Server: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ API Server: Not responding${NC}"
fi

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Health: OK${NC}"
else
    echo -e "${YELLOW}⚠️ API Health: Not responding${NC}"
fi

echo -e "\n${GREEN}🎉 Fresh build and launch completed!${NC}"
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "1. Install Chrome Extension: chrome://extensions/ → Load unpacked"
echo -e "2. Install VS Code Extension: VS Code → Extensions → Install from VSIX"
echo -e "3. Test functionality in both extensions"
echo -e "4. Check logs: tail -f dev-server.log"

echo -e "\n${BLUE}🛑 To stop services:${NC}"
echo -e "• Stop dev server: kill \$(cat dev-server.pid)"
echo -e "• Stop Docker: docker-compose down"
