#!/bin/bash

# Comprehensive status check for The New Fuse
echo "🔍 The New Fuse - Complete System Status Check"
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if services are running
echo -e "\n${BLUE}📊 Service Status:${NC}"

# Check Frontend (port 3000)
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend (3000) - Running${NC}"
else
    echo -e "${RED}❌ Frontend (3000) - Not responding${NC}"
fi

# Check API Server (port 3001)
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ API Server (3001) - Running${NC}"
else
    echo -e "${RED}❌ API Server (3001) - Not responding${NC}"
fi

# Check API Health endpoint
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ API Health - OK${NC}"
else
    echo -e "${RED}❌ API Health - Not responding${NC}"
fi

# Check Message Broker (port 3002)
if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}✅ Message Broker (3002) - Running${NC}"
else
    echo -e "${YELLOW}⚠️ Message Broker (3002) - Not running (optional)${NC}"
fi

# Check Redis (port 6379)
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis (6379) - Running${NC}"
else
    echo -e "${YELLOW}⚠️ Redis (6379) - Not running${NC}"
fi

# Check Docker containers
echo -e "\n${BLUE}🐳 Docker Status:${NC}"
docker-compose ps 2>/dev/null || echo -e "${YELLOW}⚠️ Docker Compose not running${NC}"

# Check build artifacts
echo -e "\n${BLUE}📦 Build Artifacts:${NC}"

# Chrome Extension
if [ -d "chrome-extension/dist" ]; then
    echo -e "${GREEN}✅ Chrome Extension - Built${NC}"
else
    echo -e "${RED}❌ Chrome Extension - Not built${NC}"
fi

# VS Code Extension
if ls src/vscode-extension/*.vsix 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ VS Code Extension - Packaged${NC}"
    echo "   Latest: $(ls -t src/vscode-extension/*.vsix | head -1)"
else
    echo -e "${RED}❌ VS Code Extension - Not packaged${NC}"
fi

# Check Bun lock file
if [ -f "bun.lockb" ]; then
    echo -e "${GREEN}✅ Bun Dependencies - Installed${NC}"
else
    echo -e "${RED}❌ Bun Dependencies - Missing${NC}"
fi

# Check process status
echo -e "\n${BLUE}🔄 Running Processes:${NC}"
echo "Node.js processes:"
ps aux | grep -i node | grep -v grep | head -5

echo -e "\nBun processes:"
ps aux | grep -i bun | grep -v grep | head -5

echo -e "\nDocker processes:"
ps aux | grep -i docker | grep -v grep | head -3

# Network status
echo -e "\n${BLUE}🌐 Network Status:${NC}"
echo "Listening on ports:"
lsof -i :3000,3001,3002,6379 2>/dev/null | head -10

echo -e "\n${BLUE}📋 Quick Actions:${NC}"
echo "🚀 Start development: bun run dev"
echo "🏗️ Build everything: bun run build:all"
echo "🐳 Start Docker: docker-compose up -d"
echo "🌐 Open test pages: ./open-test-pages.sh"
echo "🔧 Install Chrome ext: Go to chrome://extensions/ → Load unpacked → chrome-extension/dist/"
echo "🔧 Install VS Code ext: VS Code → Extensions → Install from VSIX → src/vscode-extension/*.vsix"

echo -e "\n${GREEN}🎉 Status check complete!${NC}"
