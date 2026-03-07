#!/bin/bash

# Search for UI files
echo "Searching for UI files..."
find . -type f \( \
    -name "*.tsx" -o \
    -name "*.jsx" -o \
    -name "*.vue" -o \
    -name "*.svelte" \
) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*"

# Search for page-like components
echo "Searching for potential pages..."
grep -r "export default" --include="*.tsx" --include="*.jsx" . \
    | grep -i "page\|view\|screen\|dashboard"

# Search for route definitions
echo "Searching for routes..."
grep -r "Route" --include="*.tsx" --include="*.jsx" . \
    | grep -i "path=\|element="