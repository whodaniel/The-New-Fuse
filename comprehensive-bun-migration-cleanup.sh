#!/bin/bash

# Comprehensive Bun Migration Cleanup Script
# This script helps complete the migration from Yarn to Bun

set -e

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Yarn to Bun Migration Cleanup${NC}"
echo -e "${BLUE}=================================${NC}"

# Step 1: Remove old Yarn files
echo -e "${YELLOW}🧹 Cleaning up old Yarn files...${NC}"

if [ -f yarn.lock ]; then
    echo -e "${YELLOW}Removing yarn.lock${NC}"
    rm yarn.lock
fi

if [ -f yarn.lock.before-fix ]; then
    echo -e "${YELLOW}Removing yarn.lock.before-fix${NC}"
    rm yarn.lock.before-fix
fi

if [ -d .yarn ]; then
    echo -e "${YELLOW}Removing .yarn directory${NC}"
    rm -rf .yarn
fi

if [ -f .yarnrc.yml ]; then
    echo -e "${YELLOW}Removing .yarnrc.yml${NC}"
    rm .yarnrc.yml
fi

# Step 2: Update package.json to use Bun
echo -e "${YELLOW}📝 Updating package.json to use Bun...${NC}"
if grep -q '"packageManager": "yarn' package.json; then
    sed -i.bak 's/"packageManager": "yarn@[^"]*"/"packageManager": "bun@1.1.38"/' package.json
    echo -e "${GREEN}✅ Updated packageManager field in package.json${NC}"
else
    echo -e "${GREEN}✅ package.json already uses Bun${NC}"
fi

# Step 3: Check Bun installation
echo -e "${YELLOW}⚡ Checking Bun installation...${NC}"
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Installing...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo -e "${GREEN}✅ Bun installed successfully${NC}"
else
    echo -e "${GREEN}✅ Bun is already installed ($(bun --version))${NC}"
fi

# Step 4: Clean node_modules and reinstall with Bun
echo -e "${YELLOW}📦 Cleaning node_modules and reinstalling with Bun...${NC}"
if [ -d node_modules ]; then
    echo -e "${YELLOW}Removing node_modules directory${NC}"
    rm -rf node_modules
fi

echo -e "${YELLOW}Installing dependencies with Bun...${NC}"
bun install

echo -e "${GREEN}✅ Dependencies installed with Bun${NC}"

# Step 5: Check for remaining Yarn references
echo -e "${YELLOW}🔍 Checking for remaining Yarn references...${NC}"

# Search for yarn references in key files (excluding node_modules, .git, etc.)
YARN_REFS=$(grep -r "yarn " --include="*.{js,ts,json,sh,md}" \
    --exclude-dir={node_modules,.git,.yarn,dist,build} \
    --exclude="*.old" \
    . 2>/dev/null | grep -v "# Converted" | grep -v "BUN-MIGRATION" || true)

if [ -n "$YARN_REFS" ]; then
    echo -e "${YELLOW}⚠️ Found remaining Yarn references:${NC}"
    echo "$YARN_REFS"
    echo -e "${YELLOW}These may need manual review.${NC}"
else
    echo -e "${GREEN}✅ No remaining Yarn references found${NC}"
fi

# Step 6: Verify Bun setup
echo -e "${YELLOW}🔍 Verifying Bun setup...${NC}"

if [ -f bun.lockb ]; then
    echo -e "${GREEN}✅ bun.lockb exists${NC}"
else
    echo -e "${RED}❌ bun.lockb not found - running bun install...${NC}"
    bun install
fi

# Step 7: Test basic Bun commands
echo -e "${YELLOW}🧪 Testing basic Bun commands...${NC}"

echo -e "${YELLOW}Testing 'bun --version'...${NC}"
bun --version

echo -e "${YELLOW}Testing 'bun run' commands...${NC}"
if bun run --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ bun run command works${NC}"
else
    echo -e "${RED}❌ bun run command failed${NC}"
fi

# Step 8: Summary
echo -e "${BLUE}📋 Migration Summary${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "${GREEN}✅ Removed old Yarn files${NC}"
echo -e "${GREEN}✅ Updated package.json to use Bun${NC}"
echo -e "${GREEN}✅ Verified Bun installation${NC}"
echo -e "${GREEN}✅ Reinstalled dependencies with Bun${NC}"
echo -e "${GREEN}✅ Created bun.lockb${NC}"

echo -e "\n${BLUE}🎉 Migration to Bun completed successfully!${NC}"
echo -e "${BLUE}===========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Run 'bun install' to install dependencies"
echo -e "2. Run 'bun run dev' to start development"
echo -e "3. Run 'bun run build' to build the project"
echo -e "4. Update any remaining scripts to use 'bun' instead of 'yarn'"

echo -e "\n${GREEN}For more information, see docs/development/BUN-SETUP.md${NC}"
