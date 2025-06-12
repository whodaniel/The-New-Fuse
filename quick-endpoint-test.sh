#!/bin/bash

# Quick endpoint tester for The New Fuse
echo "🔍 The New Fuse - Endpoint Status Check"
echo "======================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name ($url): "
    
    if timeout 5s curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to test endpoint with response
test_endpoint_with_response() {
    local url=$1
    local name=$2
    
    echo "Testing $name ($url):"
    
    response=$(timeout 5s curl -s "$url" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo -e "${GREEN}✅ Response received:${NC}"
        echo "$response" | head -3
        echo ""
        return 0
    else
        echo -e "${RED}❌ No response${NC}"
        echo ""
        return 1
    fi
}

# Test all endpoints
echo -e "\n${BLUE}🌐 Web Endpoints:${NC}"
test_endpoint "http://localhost:3000" "Frontend"
test_endpoint "http://localhost:3001" "API Server"
test_endpoint_with_response "http://localhost:3001/api/health" "Health Check"
test_endpoint "http://localhost:3001/api/docs" "API Documentation"

# Check processes
echo -e "\n${BLUE}🔄 Process Status:${NC}"
if pgrep -f "bun.*dev" > /dev/null; then
    echo -e "${GREEN}✅ Bun dev server running${NC}"
else
    echo -e "${RED}❌ Bun dev server not found${NC}"
fi

if pgrep -f "node" > /dev/null; then
    echo -e "${GREEN}✅ Node processes running${NC}"
else
    echo -e "${YELLOW}⚠️ No Node processes found${NC}"
fi

# Check Docker
echo -e "\n${BLUE}🐳 Docker Status:${NC}"
if docker ps > /dev/null 2>&1; then
    running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v NAMES)
    if [ -n "$running_containers" ]; then
        echo -e "${GREEN}✅ Docker containers running:${NC}"
        echo "$running_containers"
    else
        echo -e "${YELLOW}⚠️ No Docker containers running${NC}"
    fi
else
    echo -e "${RED}❌ Docker not accessible${NC}"
fi

# Check ports
echo -e "\n${BLUE}📡 Port Usage:${NC}"
for port in 3000 3001 3002 6379; do
    if lsof -i :$port > /dev/null 2>&1; then
        process=$(lsof -i :$port | tail -1 | awk '{print $1}')
        echo -e "${GREEN}✅ Port $port: $process${NC}"
    else
        echo -e "${RED}❌ Port $port: Not in use${NC}"
    fi
done

# Check build artifacts
echo -e "\n${BLUE}📦 Build Artifacts:${NC}"

# Chrome Extension
if [ -d "chrome-extension/dist" ] && [ -f "chrome-extension/dist/manifest.json" ]; then
    echo -e "${GREEN}✅ Chrome Extension: Built${NC}"
    echo "   Location: chrome-extension/dist/"
else
    echo -e "${RED}❌ Chrome Extension: Not built${NC}"
fi

# VS Code Extension
if ls src/vscode-extension/*.vsix 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ VS Code Extension: Packaged${NC}"
    echo "   Latest: $(ls -t src/vscode-extension/*.vsix | head -1)"
else
    echo -e "${RED}❌ VS Code Extension: Not packaged${NC}"
fi

echo -e "\n${BLUE}📋 Summary:${NC}"
echo "• Frontend should be at: http://localhost:3000"
echo "• API should be at: http://localhost:3001" 
echo "• Chrome extension: chrome://extensions/ → Load unpacked"
echo "• VS Code extension: Extensions → Install from VSIX"

echo -e "\n${BLUE}🚀 Quick Fixes:${NC}"
echo "• Start frontend: bun run dev"
echo "• Start API: bun run dev:api" 
echo "• Build Chrome ext: ./build-chrome-ext-bun.sh"
echo "• Package VS Code ext: cd src/vscode-extension && bun run package"
