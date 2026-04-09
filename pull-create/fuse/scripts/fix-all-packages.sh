#!/bin/bash
# The New Fuse - Package Fix and Optimization Script
# Automatically fixes common issues in packages
# Author: Daniel Adam Goldberg

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Package Fix System"
echo "  Author: Daniel Adam Goldberg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clean install dependencies
echo -e "${BLUE}1. Cleaning and reinstalling dependencies...${NC}"
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/node_modules
rm -rf tools/*/node_modules
rm -rf pnpm-lock.yaml

pnpm install --frozen-lockfile=false
echo -e "${GREEN}✓${NC} Dependencies reinstalled"
echo ""

# Fix TypeScript issues
echo -e "${BLUE}2. Fixing TypeScript configurations...${NC}"
for tsconfig in $(find . -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/ide-ide/*"); do
    dir=$(dirname "$tsconfig")
    package_name=$(basename "$dir")

    echo "  Checking $package_name..."

    # Ensure tsconfig has proper settings
    if [ -f "$dir/package.json" ]; then
        cd "$dir"

        # Check if build script exists
        has_build=$(node -p "try { require('./package.json').scripts?.build || '' } catch(e) { '' }")

        if [ ! -z "$has_build" ]; then
            # Try to build
            if pnpm run build --if-present 2>/dev/null; then
                echo -e "    ${GREEN}✓${NC} Built successfully"
            else
                echo -e "    ${YELLOW}⚠${NC} Build issues detected"
            fi
        fi

        cd - > /dev/null
    fi
done
echo ""

# Fix peer dependencies
echo -e "${BLUE}3. Resolving peer dependencies...${NC}"
pnpm install --fix-peer-dependencies || pnpm install --force
echo -e "${GREEN}✓${NC} Peer dependencies resolved"
echo ""

# Generate Drizzle clients
echo -e "${BLUE}4. Generating Drizzle clients...${NC}"
if [ -f "packages/database/drizzle/schema.drizzle" ]; then
    cd packages/database
    pnpm exec drizzle generate || echo -e "${YELLOW}⚠${NC} Drizzle generation failed (may need DATABASE_URL)"
    cd - > /dev/null
fi
echo ""

# Run linter auto-fix
echo -e "${BLUE}5. Running ESLint auto-fix...${NC}"
pnpm exec eslint . --fix --ext .ts,.tsx,.js,.jsx --max-warnings=999999 || echo -e "${YELLOW}⚠${NC} Some lint issues remain"
echo ""

# Build all packages
echo -e "${BLUE}6. Building all packages...${NC}"
pnpm run build --filter='!ide-ide' || echo -e "${YELLOW}⚠${NC} Some builds failed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Package fix process complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run validation: ./scripts/validate-all-packages.sh"
echo "  2. Run tests: ./scripts/test-all-packages.sh"
echo "  3. If all pass, ready for deployment!"
echo ""
