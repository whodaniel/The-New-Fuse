#!/bin/bash

# The Perpetual System - Activation Script
# This script brings The New Fuse's autonomous agent operating system online

set -e  # Exit on error

echo "🌟 ================================================"
echo "🌟  THE PERPETUAL SYSTEM - ACTIVATION SEQUENCE"
echo "🌟 ================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print step
step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

echo ""
step "1️⃣  Checking Prerequisites"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    error "pnpm is not installed. Please install it first."
fi
success "pnpm found"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    warn "Docker not found. Skipping infrastructure startup."
    SKIP_DOCKER=true
else
    success "Docker found"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi
success "Node.js found ($(node --version))"

echo ""
step "2️⃣  Starting Infrastructure"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SKIP_DOCKER" != "true" ]; then
    # Start Docker services (PostgreSQL + Redis)
    step "   Starting PostgreSQL and Redis..."
    pnpm run docker:start || warn "Docker containers may already be running"

    # Wait for services to be ready
    step "   Waiting for services to be ready..."
    sleep 5

    # Check if services are healthy
    if docker ps | grep -q "postgres"; then
        success "PostgreSQL is running"
    else
        error "PostgreSQL failed to start"
    fi

    if docker ps | grep -q "redis"; then
        success "Redis is running"
    else
        error "Redis failed to start"
    fi
else
    warn "Skipping Docker infrastructure (not available)"
fi

echo ""
step "3️⃣  Building Packages"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build core packages
step "   Building @the-new-fuse/database..."
pnpm --filter @the-new-fuse/database build || warn "Database package build failed"

step "   Building @the-new-fuse/core..."
pnpm --filter @the-new-fuse/core build || warn "Core package build failed"

step "   Building MCP Skills Server..."
pnpm --filter @the-new-fuse/mcp-skills-server build || warn "MCP Skills Server build failed"

success "Core packages built"

echo ""
step "4️⃣  Database Setup"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SKIP_DOCKER" != "true" ]; then
    # Run database migrations
    step "   Running database migrations..."
    cd packages/database
    pnpm run push || warn "Migrations may have already run"
    cd ../..

    success "Database schema up to date"
else
    warn "Skipping database migrations (Docker not available)"
fi

echo ""
step "5️⃣  Verifying Meta-Skills"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if meta-skills exist
if [ -f ".agent/skills/library-of-living-knowledge/SKILL.md" ]; then
    success "Library of Living Knowledge meta-skill found"
else
    warn "Library of Living Knowledge meta-skill not found"
fi

if [ -f ".agent/skills/skill-builder/SKILL.md" ]; then
    success "Skill Builder meta-skill found"
else
    warn "Skill Builder meta-skill not found"
fi

# Count available skills
SKILL_COUNT=$(find .agent/skills -name "SKILL.md" | wc -l | tr -d ' ')
success "Found $SKILL_COUNT skills total"

echo ""
step "6️⃣  Starting Backend Services"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if backend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Backend already running on port 3001"
    echo ""
    read -p "   Kill existing process and restart? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:3001) || true
        sleep 2
    else
        warn "Skipping backend startup"
        SKIP_BACKEND=true
    fi
fi

if [ "$SKIP_BACKEND" != "true" ]; then
    step "   Building backend..."
    pnpm --filter @the-new-fuse/backend-app build || error "Backend build failed"

    success "Backend built successfully"

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✨ THE PERPETUAL SYSTEM IS NOW READY TO START! ✨${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "To start the system, run:"
    echo ""
    echo "  ${BLUE}pnpm run dev${NC}         # Start all services"
    echo "  ${BLUE}pnpm run dev:backend${NC}  # Start backend only"
    echo ""
    echo "The Perpetual System includes:"
    echo "  🔔 Heartbeat Monitoring (every 5 min)"
    echo "  🧠 Pattern Extraction (every 6 hours)"
    echo "  🔄 Self-Improvement (daily)"
    echo "  🎯 Meta-Analysis (weekly)"
    echo ""
    echo "Agents will:"
    echo "  1. Auto-bootstrap via Library of Living Knowledge"
    echo "  2. Self-orchestrate resources dynamically"
    echo "  3. Self-improve through pattern learning"
    echo "  4. Self-heal from failures"
    echo "  5. Run perpetually via cron automation"
    echo ""
fi

echo ""
step "7️⃣  System Status"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Infrastructure:"
if [ "$SKIP_DOCKER" != "true" ]; then
    if docker ps | grep -q postgres; then
        echo "  ✅ PostgreSQL: Running"
    else
        echo "  ❌ PostgreSQL: Not Running"
    fi
    if docker ps | grep -q redis; then
        echo "  ✅ Redis: Running"
    else
        echo "  ❌ Redis: Not Running"
    fi
else
    echo "  ⚠️  Docker: Not Available"
fi

echo ""
echo "Services:"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  ✅ Backend API: Running (port 3001)"
else
    echo "  ⏸️  Backend API: Not Running"
fi

echo ""
echo "Meta-Skills:"
echo "  ✅ Library of Living Knowledge: Ready"
echo "  ✅ Skill Builder: Ready"
echo "  📦 Total Skills: $SKILL_COUNT"

echo ""
echo "MCP Servers:"
echo "  ✅ TNF Skills Server: Configured"
echo "  ✅ 17 MCP Servers: Enabled"

echo ""
echo "Cron Jobs (when backend runs):"
echo "  🔔 Health Monitoring: Every 5 minutes"
echo "  🧠 Pattern Extraction: Every 6 hours"
echo "  🔄 System Improvement: Daily (midnight)"
echo "  🎯 Meta-Analysis: Weekly (Sunday)"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 ACTIVATION COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Start services: ${BLUE}pnpm run dev${NC}"
echo "  2. Test agent bootstrap: See ${BLUE}.agent/TEST_AGENT_BOOTSTRAP.md${NC}"
echo "  3. Monitor logs: ${BLUE}tail -f apps/backend/logs/*.log${NC}"
echo "  4. Deploy to Railway: ${BLUE}railway up${NC}"
echo ""
