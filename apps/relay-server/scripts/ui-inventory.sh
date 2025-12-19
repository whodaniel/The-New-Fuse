#!/bin/bash
set -e

echo "🔍 Starting comprehensive UI inventory..."

# Create results directory
RESULTS_DIR="./ui-audit-results"
mkdir -p "$RESULTS_DIR"

# 1. Find all UI files and components
echo "📁 Scanning for UI files..."
find . -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" | grep -v "node_modules\|dist\|build" > "$RESULTS_DIR/all-ui-files.txt"

# 2. Extract component definitions
echo "🔎 Extracting component definitions..."
while IFS= read -r file; do
    echo "Analyzing: $file"
    # Find React components
    grep -H "^export.*\(function\|const\).*\(Component\|Page\|View\|Screen\)" "$file" >> "$RESULTS_DIR/components.txt" 2>/dev/null || true
    # Find class components
    grep -H "^export.*class.*extends.*Component" "$file" >> "$RESULTS_DIR/class-components.txt" 2>/dev/null || true
done < "$RESULTS_DIR/all-ui-files.txt"

# 3. Extract routes and pages
echo "🗺️  Mapping routes and pages..."
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -exec grep -l "Route.*path=" {} \; > "$RESULTS_DIR/routes.txt"

# 4. Generate component dependency tree
echo "🌳 Generating component dependency tree..."
while IFS= read -r file; do
    echo "File: $file" >> "$RESULTS_DIR/dependency-tree.txt"
    grep -H "import.*from" "$file" | grep -v "node_modules" >> "$RESULTS_DIR/dependency-tree.txt" 2>/dev/null || true
    echo "---" >> "$RESULTS_DIR/dependency-tree.txt"
done < "$RESULTS_DIR/all-ui-files.txt"

echo "✅ UI inventory complete. Results saved in $RESULTS_DIR"
