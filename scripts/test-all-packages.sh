#!/bin/bash
# The New Fuse - Complete Package Testing Script
# Runs all tests across the monorepo (excluding SkIDEancer)
# Author: Daniel Adam Goldberg

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TEST_SUITES=0
PASSED_TEST_SUITES=0
FAILED_TEST_SUITES=0
SKIPPED_TEST_SUITES=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Testing System"
echo "  Author: Daniel Adam Goldberg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_tests() {
    local package_dir=$1
    local package_name=$(basename $package_dir)

    # Skip SkIDEancer
    if [[ $package_name == "ide-ide" ]]; then
        echo -e "${YELLOW}⊘${NC} Skipping $package_name (SkIDEancer excluded)"
        ((SKIPPED_TEST_SUITES++))
        return 0
    fi

    # Check for package.json
    if [ ! -f "$package_dir/package.json" ]; then
        return 0
    fi

    cd "$package_dir"

    # Check for test script
    local has_test_script=$(node -p "try { require('./package.json').scripts?.test || '' } catch(e) { '' }")

    if [ ! -z "$has_test_script" ]; then
        echo -e "${BLUE}Running tests for $package_name...${NC}"
        ((TOTAL_TEST_SUITES++))

        if pnpm test 2>&1 | tee "/tmp/test_${package_name}.log"; then
            echo -e "${GREEN}✓${NC} $package_name: Tests passed"
            ((PASSED_TEST_SUITES++))
        else
            echo -e "${RED}✗${NC} $package_name: Tests failed (check /tmp/test_${package_name}.log)"
            ((FAILED_TEST_SUITES++))
        fi
        echo ""
    fi
}

# Run tests for all packages
for package_dir in packages/*/; do
    [ -d "$package_dir" ] && run_tests "$package_dir"
done

for app_dir in apps/*/; do
    [ -d "$app_dir" ] && run_tests "$app_dir"
done

for tool_dir in tools/*/; do
    [ -d "$tool_dir" ] && run_tests "$tool_dir"
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test suites run: $TOTAL_TEST_SUITES"
echo -e "${GREEN}Passed: $PASSED_TEST_SUITES${NC}"
echo -e "${RED}Failed: $FAILED_TEST_SUITES${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_TEST_SUITES${NC}"
echo ""

if [ $FAILED_TEST_SUITES -gt 0 ]; then
    echo -e "${RED}⚠️  Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
