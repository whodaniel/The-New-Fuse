#!/bin/bash

# Environment Verification Script
# Verifies that the development environment is clean and ready

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Clean Development Environment${NC}"
echo ""

# Check for running processes
echo -e "${BLUE}📋 Checking for running development processes...${NC}"
dev_processes=$(pgrep -f "node.*dev\|bun.*dev\|yarn.*dev\|npm.*dev\|turbo.*dev\|webpack\|vite\|electron\|ide" 2>/dev/null || true)
if [ -z "$dev_processes" ]; then
    echo -e "${GREEN}✅ No development processes running${NC}"
else
    echo -e "${YELLOW}⚠️  Found running processes:${NC}"
    echo "$dev_processes" | xargs ps -p 2>/dev/null || true
fi

# Check for occupied ports
echo ""
echo -e "${BLUE}🔌 Checking development ports...${NC}"
ports=(3000 3001 3002 3003 3004 3005 3006 3007 8080 8081 5173 4200)
occupied_ports=()

for port in "${ports[@]}"; do
    if lsof -i:$port >/dev/null 2>&1; then
        occupied_ports+=($port)
    fi
done

if [ ${#occupied_ports[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All development ports are clear${NC}"
else
    echo -e "${YELLOW}⚠️  Occupied ports: ${occupied_ports[*]}${NC}"
    for port in "${occupied_ports[@]}"; do
        echo "  Port $port: $(lsof -i:$port | tail -n +2)"
    done
fi

# Check disk space
echo ""
echo -e "${BLUE}💾 Current disk usage:${NC}"
du -sh . 2>/dev/null || echo "Could not calculate size"

# Check for large cache directories
echo ""
echo -e "${BLUE}📁 Checking for remaining cache directories...${NC}"
large_dirs=$(find . -name ".turbo" -o -name "node_modules/.cache" -o -name ".cache" -o -name "dist" -o -name "coverage" 2>/dev/null | head -5)
if [ -z "$large_dirs" ]; then
    echo -e "${GREEN}✅ No large cache directories found${NC}"
else
    echo -e "${YELLOW}⚠️  Found cache directories:${NC}"
    echo "$large_dirs"
fi

# Check native modules status
echo ""
echo -e "${BLUE}🔧 Checking native modules...${NC}"
if node scripts/pre-build-check.cjs 2>/dev/null | grep -q "✅ Native modules ready"; then
    echo -e "${GREEN}✅ Native modules are ready${NC}"
else
    echo -e "${YELLOW}⚠️  Native modules may need attention${NC}"
    echo "  Run: pnpm run fix:native-modules"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Environment Status Summary:${NC}"
if [ -z "$dev_processes" ] && [ ${#occupied_ports[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Environment is clean and ready for development${NC}"
    echo -e "${GREEN}🚀 You can now run: pnpm run dev${NC}"
else
    echo -e "${YELLOW}⚠️  Environment needs attention before starting development${NC}"
    if [ -n "$dev_processes" ]; then
        echo "  • Kill remaining processes"
    fi
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        echo "  • Clear occupied ports"
    fi
    echo "  • Run: pnpm run clean:dev for comprehensive cleanup"
fi