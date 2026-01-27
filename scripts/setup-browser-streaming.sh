#!/bin/bash

# Browser Streaming Setup Script
# Installs all dependencies and configures the system

set -e

echo "🚀 Setting up Browser Streaming for AI Command Center..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd apps/api
pnpm add playwright socket.io @nestjs/websockets @nestjs/platform-socket.io
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# 2. Install Playwright browsers
echo -e "${BLUE}🌐 Installing Playwright Chromium browser...${NC}"
pnpm exec playwright install chromium --with-deps
echo -e "${GREEN}✅ Chromium installed${NC}"
echo ""

# 3. Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd ../frontend
pnpm add socket.io-client
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# 4. Setup environment variables
echo -e "${BLUE}⚙️  Configuring environment variables...${NC}"

# Backend .env
cd ../api
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

if ! grep -q "BROWSER_STREAMING_ENABLED" .env; then
    echo "" >> .env
    echo "# Browser Streaming Configuration" >> .env
    echo "BROWSER_STREAMING_ENABLED=true" >> .env
    echo "BROWSER_STREAMING_FPS=2" >> .env
    echo "BROWSER_STREAMING_JPEG_QUALITY=70" >> .env
    echo -e "${GREEN}✅ Backend .env configured${NC}"
else
    echo -e "${YELLOW}⚠️  Browser streaming config already exists in backend .env${NC}"
fi

# Frontend .env
cd ../frontend
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

if ! grep -q "VITE_BACKEND_URL" .env; then
    echo "" >> .env
    echo "# Backend API URL" >> .env
    echo "VITE_BACKEND_URL=http://localhost:3001" >> .env
    echo -e "${GREEN}✅ Frontend .env configured${NC}"
else
    echo -e "${YELLOW}⚠️  Backend URL already exists in frontend .env${NC}"
fi

echo ""

# 5. Return to root
cd ../..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Start the backend:  pnpm --filter @the-new-fuse/api run dev"
echo "  2. Start the frontend: pnpm --filter @the-new-fuse/frontend run dev"
echo "  3. Navigate to:        http://localhost:3000/ai-command-center-streaming"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC} docs/AI_COMMAND_CENTER_BROWSER_STREAMING.md"
echo ""
