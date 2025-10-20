#!/bin/bash
# The New Fuse - Build Error Fix Script
# Fixes the 8 failing packages identified in validation
# Author: Daniel Adam Goldberg

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Build Error Fix Script"
echo "  Author: Daniel Adam Goldberg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fix 1: Frontend - Install missing @tailwindcss/postcss
echo -e "${BLUE}Fix 1: Installing @tailwindcss/postcss for frontend...${NC}"
cd apps/frontend
pnpm add -D @tailwindcss/postcss
cd ../..
echo -e "${GREEN}✓${NC} Tailwind PostCSS installed"
echo ""

# Fix 2: Database - Generate Prisma client
echo -e "${BLUE}Fix 2: Generating Prisma client...${NC}"
cd packages/database
pnpm exec prisma generate || echo -e "${YELLOW}⚠${NC} Prisma generation needs DATABASE_URL"
cd ../..
echo -e "${GREEN}✓${NC} Prisma client generation attempted"
echo ""

# Fix 3: Clean and reinstall dependencies
echo -e "${BLUE}Fix 3: Cleaning node_modules in failing packages...${NC}"
for pkg in "packages/api" "packages/agent" "packages/mcp-core" "packages/workflow-engine" "packages/extension-system" "packages/relay-core"; do
    if [ -d "$pkg" ]; then
        echo "  Cleaning $pkg..."
        rm -rf "$pkg/node_modules"
        rm -rf "$pkg/dist"
    fi
done
echo -e "${GREEN}✓${NC} Cleaned failing packages"
echo ""

# Fix 4: Reinstall dependencies
echo -e "${BLUE}Fix 4: Reinstalling dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓${NC} Dependencies reinstalled"
echo ""

# Fix 5: Try building failing packages individually
echo -e "${BLUE}Fix 5: Attempting to rebuild failing packages...${NC}"

echo "  Building database..."
cd packages/database
pnpm run build || echo -e "${YELLOW}⚠${NC} Database build issues (may need DATABASE_URL)"
cd ../..

echo "  Building api..."
cd packages/api
pnpm run build || echo -e "${YELLOW}⚠${NC} API build issues"
cd ../..

echo "  Building agent..."
cd packages/agent
pnpm run build || echo -e "${YELLOW}⚠${NC} Agent build issues"
cd ../..

echo "  Building frontend..."
cd apps/frontend
pnpm run build || echo -e "${YELLOW}⚠${NC} Frontend build issues"
cd ../..

echo "  Building mcp-core..."
cd packages/mcp-core
pnpm run build || echo -e "${YELLOW}⚠${NC} MCP Core build issues"
cd ../..

echo "  Building workflow-engine..."
cd packages/workflow-engine
pnpm run build || echo -e "${YELLOW}⚠${NC} Workflow Engine build issues"
cd ../..

echo "  Building extension-system..."
cd packages/extension-system
pnpm run build || echo -e "${YELLOW}⚠${NC} Extension System build issues"
cd ../..

echo "  Building relay-core..."
cd packages/relay-core
pnpm run build || echo -e "${YELLOW}⚠${NC} Relay Core build issues"
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Fix script complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set DATABASE_URL if using database: export DATABASE_URL='postgresql://...'"
echo "  2. Rerun build: turbo run build --filter='./packages/*' --filter='./apps/*'"
echo "  3. Check PRE_DEPLOYMENT_CHECKLIST.md for deployment readiness"
echo ""
