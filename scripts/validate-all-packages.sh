#!/bin/bash
# The New Fuse - Complete Package Validation Script
# Validates all packages are buildable and functional (excluding SkIDEancer)
# Author: Daniel Adam Goldberg

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_PACKAGES=0
PASSED_PACKAGES=0
FAILED_PACKAGES=0
SKIPPED_PACKAGES=0

# Arrays to track results
PASSED=()
FAILED=()
SKIPPED=()

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Package Validation System"
echo "  Author: Daniel Adam Goldberg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to print status
print_status() {
    local status=$1
    local package=$2
    local message=$3

    case $status in
        "pass")
            echo -e "${GREEN}✓${NC} ${package}: ${message}"
            PASSED+=("$package")
            ((PASSED_PACKAGES++))
            ;;
        "fail")
            echo -e "${RED}✗${NC} ${package}: ${message}"
            FAILED+=("$package")
            ((FAILED_PACKAGES++))
            ;;
        "skip")
            echo -e "${YELLOW}⊘${NC} ${package}: ${message}"
            SKIPPED+=("$package")
            ((SKIPPED_PACKAGES++))
            ;;
        "info")
            echo -e "${BLUE}ℹ${NC} ${message}"
            ;;
    esac
}

# Function to validate a package
validate_package() {
    local package_dir=$1
    local package_name=$(basename $package_dir)

    ((TOTAL_PACKAGES++))

    # Skip SkIDEancer
    if [[ $package_name == "ide-ide" ]]; then
        print_status "skip" "$package_name" "Excluded from validation (SkIDEancer on back burner)"
        return 0
    fi

    # Check if package.json exists
    if [ ! -f "$package_dir/package.json" ]; then
        print_status "skip" "$package_name" "No package.json found"
        return 0
    fi

    print_status "info" "Validating $package_name..."

    cd "$package_dir"

    # Check for TypeScript configuration
    local has_tsconfig=false
    if [ -f "tsconfig.json" ]; then
        has_tsconfig=true
    fi

    # Check for build script
    local has_build_script=$(node -p "try { require('./package.json').scripts?.build || '' } catch(e) { '' }")

    # Try to build
    if [ ! -z "$has_build_script" ]; then
        if pnpm run build 2>&1 | tee "/tmp/build_${package_name}.log" | grep -qi "error"; then
            print_status "fail" "$package_name" "Build failed (check /tmp/build_${package_name}.log)"
            return 1
        else
            print_status "pass" "$package_name" "Build successful"
            return 0
        fi
    elif [ "$has_tsconfig" = true ]; then
        # Try TypeScript compilation if no build script but has tsconfig
        if pnpm exec tsc --noEmit 2>&1 | tee "/tmp/typecheck_${package_name}.log" | grep -qi "error"; then
            print_status "fail" "$package_name" "TypeScript check failed (check /tmp/typecheck_${package_name}.log)"
            return 1
        else
            print_status "pass" "$package_name" "TypeScript check passed"
            return 0
        fi
    else
        print_status "pass" "$package_name" "No build required (JS only)"
        return 0
    fi
}

# Main validation
print_status "info" "Starting validation of all packages..."
echo ""

# Validate packages in packages/
if [ -d "packages" ]; then
    print_status "info" "Validating packages in packages/..."
    for package_dir in packages/*/; do
        if [ -d "$package_dir" ]; then
            validate_package "$package_dir" || true
        fi
    done
    echo ""
fi

# Validate apps in apps/
if [ -d "apps" ]; then
    print_status "info" "Validating apps in apps/..."
    for app_dir in apps/*/; do
        if [ -d "$app_dir" ]; then
            validate_package "$app_dir" || true
        fi
    done
    echo ""
fi

# Validate tools in tools/
if [ -d "tools" ]; then
    print_status "info" "Validating tools in tools/..."
    for tool_dir in tools/*/; do
        if [ -d "$tool_dir" ]; then
            validate_package "$tool_dir" || true
        fi
    done
    echo ""
fi

# Print summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total packages checked: $TOTAL_PACKAGES"
echo -e "${GREEN}Passed: $PASSED_PACKAGES${NC}"
echo -e "${RED}Failed: $FAILED_PACKAGES${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_PACKAGES${NC}"
echo ""

# Show failed packages
if [ ${#FAILED[@]} -gt 0 ]; then
    echo -e "${RED}Failed packages:${NC}"
    for pkg in "${FAILED[@]}"; do
        echo "  - $pkg"
    done
    echo ""
fi

# Show skipped packages
if [ ${#SKIPPED[@]} -gt 0 ]; then
    echo -e "${YELLOW}Skipped packages:${NC}"
    for pkg in "${SKIPPED[@]}"; do
        echo "  - $pkg"
    done
    echo ""
fi

# Exit with error if any packages failed
if [ $FAILED_PACKAGES -gt 0 ]; then
    echo -e "${RED}⚠️  Validation failed! Fix errors before deployment.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All packages validated successfully!${NC}"
    echo ""
    echo "Ready for deployment to Docker Hub and CloudRuntime."
    exit 0
fi
