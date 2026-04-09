#!/bin/bash
set -e

echo "🔍 Starting Post-Reorganization Analysis"

# Function to analyze component usage
analyze_components() {
    local dir=$1
    echo "Analyzing components in $dir..."
    find "$dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sh -c '
        echo "Component: $0"
        grep -r "import.*from.*$0" . --include="*.tsx" --include="*.jsx" || true
    ' {} \;
}

# Function to detect duplicate implementations
find_duplicates() {
    local base_dir=$1
    # Use shasum instead of md5sum for macOS compatibility
    find "$base_dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec shasum {} \; | \
    awk '{print $1}' | sort | uniq -d | \
    while read hash; do
        echo "Duplicate files with hash $hash:"
        find "$base_dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec shasum {} \; | grep "$hash"
    done
}

# Create analysis report
generate_report() {
    cat > analysis_report.md << EOL
# Component Analysis Report
Generated: $(date)

## Component Usage Statistics
$(analyze_components "packages/ui-components")

## Duplicate Implementations
$(find_duplicates "packages")

## Integration Points
$(grep -r "import.*from.*@" . --include="*.tsx" --include="*.jsx")
EOL
}

# Main execution
main() {
    echo "📊 Generating component analysis..."
    generate_report

    echo "🔍 Checking for orphaned components..."
    find . -type f -name "*.tsx" -o -name "*.jsx" | while read -r file; do
        if ! grep -r "import.*$(basename "$file" .tsx)" . --exclude="$file" > /dev/null; then
            echo "⚠️  Potentially unused component: $file"
        fi
    done
}

main
