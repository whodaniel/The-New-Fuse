#!/bin/bash
# scripts/boot-tnf.sh - TNF Unified Ecosystem Boot Script
# Standardized initialization for The New Fuse unified network

set -e  # Exit on error

echo "🚀 ================================================"
echo "   THE NEW FUSE - UNIFIED NETWORK BOOT"
echo "================================================"
echo ""

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${CYAN}📁 Project Root: $PROJECT_ROOT${NC}"
echo ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

echo -e "${BLUE}🔍 Checking Prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 22+ first.${NC}"
    echo -e "${YELLOW}   Run: brew install node@22${NC}"
    exit 1
fi

# Get Node.js version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✅ pnpm: v$PNPM_VERSION${NC}"

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}❌ Redis CLI not found. Please install Redis first.${NC}"
    echo -e "${YELLOW}   Run: brew install redis${NC}"
    exit 1
fi

echo ""

# ============================================================================
# STEP 2: Start Redis
# ============================================================================

echo -e "${BLUE}🔴 Starting Redis Server...${NC}"

# Check if Redis is already running
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis already running on port 6379${NC}"
else
    echo -e "${YELLOW}⏳ Starting redis-server on port 6379...${NC}"
    redis-server --port 6379 --daemonize yes
    sleep 2

    # Verify Redis started
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis server started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start Redis server${NC}"
        exit 1
    fi
fi

echo ""

# ============================================================================
# STEP 3: Install Dependencies (if needed)
# ============================================================================

echo -e "${BLUE}📦 Checking Dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Installing root dependencies...${NC}"
    pnpm install
else
    echo -e "${GREEN}✅ Root dependencies already installed${NC}"
fi

echo ""

# ============================================================================
# STEP 4: Start TNF Relay Server
# ============================================================================

echo -e "${BLUE}📡 Starting TNF Relay Server (The Central Nervous System)...${NC}"

# Check if relay server exists
if [ -d "apps/relay-server" ]; then
    cd "$PROJECT_ROOT/apps/relay-server"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⏳ Installing relay dependencies...${NC}"
        pnpm install
    fi

    # Start relay in background
    echo -e "${YELLOW}⏳ Launching relay server on http://localhost:3000...${NC}"
    pnpm run start &
    RELAY_PID=$!
    echo -e "${GREEN}✅ Relay server started (PID: $RELAY_PID)${NC}"

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}⚠️  Relay server directory not found, skipping...${NC}"
fi

echo ""

# ============================================================================
# STEP 5: Build Chrome Extension
# ============================================================================

echo -e "${BLUE}🌐 Building Chrome Extension...${NC}"

if [ -d "apps/chrome-extension" ]; then
    cd "$PROJECT_ROOT/apps/chrome-extension"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⏳ Installing Chrome extension dependencies...${NC}"
        pnpm install
    fi

    # Build extension
    echo -e "${YELLOW}⏳ Building extension...${NC}"
    pnpm run build
    echo -e "${GREEN}✅ Chrome extension built${NC}"
    echo -e "${CYAN}   📂 Load unpacked from: $PROJECT_ROOT/apps/chrome-extension/dist${NC}"

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}⚠️  Chrome extension directory not found, skipping...${NC}"
fi

echo ""

# ============================================================================
# STEP 6: Prepare VS Code Extension
# ============================================================================

echo -e "${BLUE}⌨️  Preparing VS Code Extension...${NC}"

if [ -d "apps/vscode-extension" ]; then
    cd "$PROJECT_ROOT/apps/vscode-extension"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⏳ Installing VS Code extension dependencies...${NC}"
        pnpm install
    fi

    # Compile extension
    echo -e "${YELLOW}⏳ Compiling extension...${NC}"
    pnpm run compile
    echo -e "${GREEN}✅ VS Code extension compiled${NC}"
    echo -e "${CYAN}   ℹ️  Press F5 in VS Code to debug${NC}"

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}⚠️  VS Code extension directory not found, skipping...${NC}"
fi

echo ""

# ============================================================================
# STEP 7: Launch Tauri Desktop App
# ============================================================================

echo -e "${BLUE}🖥️  Launching Tauri Desktop (OAGI/Lux Enabled)...${NC}"

if [ -d "apps/tauri-desktop" ]; then
    cd "$PROJECT_ROOT/apps/tauri-desktop"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⏳ Installing Tauri dependencies...${NC}"
        pnpm install
    fi

    # Start Tauri in development mode
    echo -e "${YELLOW}⏳ Starting Tauri dev server...${NC}"
    pnpm tauri dev &
    TAURI_PID=$!
    echo -e "${GREEN}✅ Tauri desktop app starting (PID: $TAURI_PID)${NC}"

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}⚠️  Tauri desktop directory not found, skipping...${NC}"
fi

echo ""

# ============================================================================
# STEP 8: Verify Network Health
# ============================================================================

echo -e "${BLUE}🩺 Verifying Network Health...${NC}"

sleep 3  # Give services time to start

# Test Redis
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis: ONLINE${NC}"
else
    echo -e "${RED}❌ Redis: OFFLINE${NC}"
fi

# Check if we can run health check
if [ -f "$PROJECT_ROOT/scripts/RelayHealthCheck.cjs" ]; then
    echo -e "${YELLOW}⏳ Running network diagnostics...${NC}"
    node "$PROJECT_ROOT/scripts/RelayHealthCheck.cjs" || echo -e "${YELLOW}⚠️  Health check incomplete (some services may still be starting)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check script not found, skipping diagnostics${NC}"
fi

echo ""

# ============================================================================
# Final Status
# ============================================================================

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   ✅ TNF NETWORK IS LIVE${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${CYAN}📊 Active Services:${NC}"
echo -e "   🔴 Redis:        ${GREEN}localhost:6379${NC}"
echo -e "   📡 Relay:        ${GREEN}http://localhost:3000${NC}"
echo -e "   🖥️  Tauri:        ${GREEN}Starting...${NC}"
echo ""
echo -e "${CYAN}🎯 Next Steps:${NC}"
echo -e "   1. Load Chrome Extension from: ${YELLOW}chrome://extensions/${NC}"
echo -e "   2. Point to: ${YELLOW}apps/chrome-extension/dist${NC}"
echo -e "   3. Open VS Code and press ${YELLOW}F5${NC} to debug extension"
echo -e "   4. Test agents: ${YELLOW}node scripts/orchestration-demo.cjs${NC}"
echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo -e "   Relay: Check terminal output above"
echo -e "   Tauri: Check Tauri dev window console"
echo ""
echo -e "${CYAN}🛑 To Stop Services:${NC}"
echo -e "   ${YELLOW}kill $RELAY_PID${NC}  # Stop Relay"
echo -e "   ${YELLOW}kill $TAURI_PID${NC}  # Stop Tauri"
echo -e "   ${YELLOW}redis-cli shutdown${NC}  # Stop Redis"
echo ""
echo -e "${CYAN}💡 Tip: Run health check anytime with:${NC}"
echo -e "   ${YELLOW}node scripts/RelayHealthCheck.cjs${NC}"
echo ""
echo -e "${GREEN}Happy Orchestrating! 🎭${NC}"
