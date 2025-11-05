#!/bin/bash

# Script to test build quality across all packages
# This script will test linting and building for each package

echo "=== Package Build Quality Testing ==="
echo "Testing all packages for clean builds..."
echo ""

# Get all package.json files in packages directory (excluding node_modules)
PACKAGES=$(find packages -name "package.json" -type f | grep -v node_modules | sort)

TOTAL_PACKAGES=0
PASSED_PACKAGES=0
FAILED_PACKAGES=0
declare -a FAILED_LIST

for package_file in $PACKAGES; do
    TOTAL_PACKAGES=$((TOTAL_PACKAGES + 1))
    
    # Get package directory
    PACKAGE_DIR=$(dirname "$package_file")
    PACKAGE_NAME=$(basename "$PACKAGE_DIR")
    
    echo "Testing package: $PACKAGE_NAME"
    echo "Directory: $PACKAGE_DIR"
    
    # Change to package directory
    cd "$PACKAGE_DIR" || continue
    
    # Check if package has TypeScript files
    HAS_TYPESCRIPT=false
    if find . -name "*.ts" -type f | grep -q .; then
        HAS_TYPESCRIPT=true
    fi
    
    # Check if package has lint script
    HAS_LINT=false
    if grep -q '"lint"' package.json 2>/dev/null; then
        HAS_LINT=true
    fi
    
    # Check if package has build script
    HAS_BUILD=false
    if grep -q '"build"' package.json 2>/dev/null; then
        HAS_BUILD=true
    fi
    
    # Run tests
    PACKAGE_FAILED=false
    FAILED_COMMANDS=""
    
    # Test linting if available and package has TypeScript
    if [ "$HAS_LINT" = true ] && [ "$HAS_TYPESCRIPT" = true ]; then
        echo "  Running lint..."
        if ! npm run lint --silent 2>/dev/null; then
            PACKAGE_FAILED=true
            FAILED_COMMANDS="${FAILED_COMMANDS}lint "
        fi
    fi
    
    # Test building if available
    if [ "$HAS_BUILD" = true ]; then
        echo "  Running build..."
        if ! npm run build --silent 2>/dev/null; then
            PACKAGE_FAILED=true
            FAILED_COMMANDS="${FAILED_COMMANDS}build "
        fi
    fi
    
    # Test TypeScript compilation if no build script but has TypeScript
    if [ "$HAS_BUILD" = false ] && [ "$HAS_TYPESCRIPT" = true ] && [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript compilation..."
        if ! npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            PACKAGE_FAILED=true
            FAILED_COMMANDS="${FAILED_COMMANDS}tsc "
        fi
    fi
    
    # Report results
    if [ "$PACKAGE_FAILED" = true ]; then
        echo "  ❌ FAILED: $FAILED_COMMANDS"
        FAILED_PACKAGES=$((FAILED_PACKAGES + 1))
        FAILED_LIST+=("$PACKAGE_NAME ($FAILED_COMMANDS)")
    else
        echo "  ✅ PASSED"
        PASSED_PACKAGES=$((PASSED_PACKAGES + 1))
    fi
    
    echo ""
    cd - > /dev/null
done

# Summary
echo "=== SUMMARY ==="
echo "Total packages tested: $TOTAL_PACKAGES"
echo "Passed: $PASSED_PACKAGES"
echo "Failed: $FAILED_PACKAGES"

if [ $FAILED_PACKAGES -gt 0 ]; then
    echo ""
    echo "Failed packages:"
    for failed in "${FAILED_LIST[@]}"; do
        echo "  ❌ $failed"
    done
fi

echo ""
echo "Build quality: $(awk "BEGIN {printf \"%.1f\", ($PASSED_PACKAGES/$TOTAL_PACKAGES)*100}")%"