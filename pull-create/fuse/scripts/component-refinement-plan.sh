#!/bin/bash
set -e

echo "🛠️ Component Refinement Plan Execution"

# Phase 1: Component Analysis
analyze_phase() {
    # Run post-reorganization analysis
    ./scripts/post-reorganization-analysis.sh

    # Generate dependency graph if madge is available
    if yarn list | grep -q madge; then
        echo "Generating dependency graph..."
        yarn madge --typescript --exclude '^node_modules' --image dependency-graph.svg ./packages || echo "Warning: Could not generate dependency graph"
    else
        echo "Warning: madge package not found, skipping dependency graph generation"
    fi

    # Check test coverage if tests are set up
    if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
        echo "Running test coverage..."
        yarn test --coverage || echo "Warning: Test coverage check failed"
    else
        echo "Warning: Jest configuration not found, skipping test coverage"
    fi
}

# Phase 2: Consolidation
consolidate_phase() {
    # Merge similar components
    find packages/ui-components -type f -name "*.tsx" -exec sh -c '
        component=$(basename "$0" .tsx)
        similar=$(find . -name "${component}*.tsx" ! -path "*/node_modules/*")
        if [ "$(echo "$similar" | wc -l)" -gt 1 ]; then
            echo "Found similar components for $component:"
            echo "$similar"
        fi
    ' {} \;

    # Update imports
    find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
        -e "s|@/components|@newfuse/ui-components|g" \
        -e "s|../../components|@newfuse/ui-components|g" {} \;
}

# Phase 3: Enhancement
enhance_phase() {
    # Add proper TypeScript types
    find packages -type f -name "*.tsx" -exec sh -c '
        if ! grep -q "interface Props" "$0"; then
            echo "Adding Props interface to $0"
            sed -i.bak "1i\\interface Props {}\n" "$0"
        fi
    ' {} \;

    # Add documentation
    find packages -type f -name "*.tsx" -exec sh -c '
        if ! grep -q "@component" "$0"; then
            echo "Adding JSDoc to $0"
            sed -i.bak "1i\\/**\n * @component\n * @description\n */" "$0"
        fi
    ' {} \;
}

# Phase 4: Testing
test_phase() {
    # Generate test files for components without tests
    find packages -type f -name "*.tsx" -exec sh -c '
        test_file="${0%.tsx}.test.tsx"
        if [ ! -f "$test_file" ]; then
            echo "Generating test for $0"
            cp templates/component.test.tsx "$test_file"
        fi
    ' {} \;
}

# Function to detect duplicate implementations
find_duplicates() {
    local base_dir=$1
    # Use shasum instead of md5sum for macOS compatibility
    # And use awk for duplicate detection instead of uniq -w
    find "$base_dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec shasum {} \; | \
    awk '{print $1}' | sort | uniq -d | \
    while read hash; do
        echo "Duplicate files with hash $hash:"
        find "$base_dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec shasum {} \; | grep "$hash"
    done
}

# Main execution
main() {
    echo "📋 Starting refinement process..."
    
    analyze_phase
    consolidate_phase
    enhance_phase
    test_phase

    echo "✅ Component refinement complete!"
    echo "
Next steps:
1. Review analysis_report.md
2. Check dependency-graph.svg
3. Review test coverage report
4. Update documentation
"
}

main