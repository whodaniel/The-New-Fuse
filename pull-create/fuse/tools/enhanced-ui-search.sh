#!/bin/bash

echo "🔍 Performing comprehensive UI component and page search..."

# Create output directory for results
mkdir -p ./ui-audit-results

# 1. Find all UI files
echo "Finding all UI files..."
find . -type f \( \
    -name "*.tsx" -o \
    -name "*.jsx" -o \
    -name "*.vue" -o \
    -name "*.svelte" \
) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" > ./ui-audit-results/all-ui-files.txt

# 2. Find potential pages
echo "Identifying potential pages..."
grep -r "export default" --include="*.tsx" --include="*.jsx" . \
    | grep -i "page\|view\|screen\|dashboard" > ./ui-audit-results/potential-pages.txt

# 3. Find route definitions
echo "Finding route definitions..."
grep -r "Route" --include="*.tsx" --include="*.jsx" . \
    | grep -i "path=\|element=" > ./ui-audit-results/routes.txt

# 4. Find component definitions
echo "Finding component definitions..."
grep -r "export.*Component" --include="*.tsx" --include="*.jsx" . > ./ui-audit-results/components.txt

# 5. Find layout components
echo "Finding layout components..."
grep -r "Layout" --include="*.tsx" --include="*.jsx" . > ./ui-audit-results/layouts.txt

# 6. Generate component tree
echo "Generating component tree..."
find . -name "*.tsx" -o -name "*.jsx" | while read file; do
    echo "File: $file"
    grep -H "import.*from" "$file" | grep -v "node_modules"
done > ./ui-audit-results/component-tree.txt

echo "✅ Search completed. Results saved in ./ui-audit-results/"