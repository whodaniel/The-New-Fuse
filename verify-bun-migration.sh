#!/bin/bash

# Bun Migration Verification Script
# This script verifies that the Yarn to Bun migration is complete

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Bun Migration Verification${NC}"
echo -e "${BLUE}=============================${NC}"

ISSUES_FOUND=0

# Check 1: Verify Bun is installed
echo -e "\n${YELLOW}1. Checking Bun installation...${NC}"
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✅ Bun is installed ($(bun --version))${NC}"
else
    echo -e "${RED}❌ Bun is not installed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 2: Verify package.json uses Bun
echo -e "\n${YELLOW}2. Checking package.json packageManager field...${NC}"
if grep -q '"packageManager": "bun@' package.json; then
    PACKAGE_MANAGER=$(grep '"packageManager"' package.json | sed 's/.*"packageManager": "\([^"]*\)".*/\1/')
    echo -e "${GREEN}✅ package.json uses ${PACKAGE_MANAGER}${NC}"
else
    echo -e "${RED}❌ package.json does not specify Bun as packageManager${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 3: Verify bun.lockb exists
echo -e "\n${YELLOW}3. Checking for bun.lockb...${NC}"
if [ -f bun.lockb ]; then
    echo -e "${GREEN}✅ bun.lockb exists${NC}"
else
    echo -e "${RED}❌ bun.lockb not found (run 'pnpm install')${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 4: Verify old Yarn files are removed
echo -e "\n${YELLOW}4. Checking for old Yarn files...${NC}"

if [ -f yarn.lock ]; then
    echo -e "${RED}❌ yarn.lock still exists${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ yarn.lock removed${NC}"
fi

if [ -d .yarn ]; then
    echo -e "${RED}❌ .yarn directory still exists${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ .yarn directory removed${NC}"
fi

if [ -f .yarnrc.yml ]; then
    echo -e "${RED}❌ .yarnrc.yml still exists${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ .yarnrc.yml removed${NC}"
fi

# Check 5: Look for remaining Yarn references in scripts
echo -e "\n${YELLOW}5. Checking for remaining Yarn references in scripts...${NC}"

YARN_SCRIPTS=$(grep -r "yarn " --include="*.sh" \
    --exclude-dir={node_modules,.git,.yarn,dist,build} \
    --exclude="*.old" \
    . 2>/dev/null | grep -v "# Converted" | grep -v "BUN-MIGRATION" || true)

if [ -n "$YARN_SCRIPTS" ]; then
    echo -e "${RED}❌ Found Yarn references in scripts:${NC}"
    echo "$YARN_SCRIPTS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No Yarn references found in scripts${NC}"
fi

# Check 6: Test basic Bun functionality
echo -e "\n${YELLOW}6. Testing basic Bun functionality...${NC}"

if bun --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ bun --version works${NC}"
else
    echo -e "${RED}❌ bun --version failed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if pnpm run --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ pnpm run works${NC}"
else
    echo -e "${RED}❌ pnpm run failed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 7: Verify converted files exist
echo -e "\n${YELLOW}7. Checking for converted files...${NC}"

CONVERTED_FILES=(
    "build-chrome-ext-bun.sh"
    "fix-bun-deps.sh"
    "fix-bun-install.sh"
    "scripts/setup-bun.js"
    "docs/development/BUN-SETUP.md"
    "docs/development/BUN-MIGRATION-SUMMARY.md"
    "comprehensive-setup-bun.sh"
)

for file in "${CONVERTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file not found${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Final summary
echo -e "\n${BLUE}📊 Migration Verification Summary${NC}"
echo -e "${BLUE}=================================${NC}"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo -e "${GREEN}All checks passed. Your project is ready to use Bun.${NC}"
    
    echo -e "\n${BLUE}Quick commands to get started:${NC}"
    echo -e "• pnpm install          # Install dependencies"
    echo -e "• pnpm run dev          # Start development"
    echo -e "• pnpm run build        # Build project"
    echo -e "• pnpm test             # Run tests"
else
    echo -e "${RED}⚠️ Migration incomplete: $ISSUES_FOUND issues found${NC}"
    echo -e "${YELLOW}Please address the issues above before proceeding.${NC}"
    
    echo -e "\n${BLUE}Recommended actions:${NC}"
    echo -e "1. Run: ./comprehensive-bun-migration-cleanup.sh"
    echo -e "2. Fix any remaining Yarn references manually"
    echo -e "3. Run this verification script again"
fi

exit $ISSUES_FOUND
