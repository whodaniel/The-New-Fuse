#!/bin/bash

# Script to analyze React component imports and dependencies
OUTPUT_FILE="ui-audit-results/dependency-tree.txt"

# Clear the output file
> "$OUTPUT_FILE"

echo "=== DEPENDENCY TREE ANALYSIS ===" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "======================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to extract imports from a file
extract_imports() {
    local file="$1"
    echo "File: $file" >> "$OUTPUT_FILE"
    
    # Extract import statements using grep
    grep -E "^import\s+.*from\s+['\"][^'\"]*['\"]|^import\s+['\"][^'\"]*['\"]" "$file" 2>/dev/null | while IFS= read -r line; do
        echo "$file:$line" >> "$OUTPUT_FILE"
    done
    
    # Also check for dynamic imports
    grep -E "import\s*\(" "$file" 2>/dev/null | while IFS= read -r line; do
        echo "$file:$line" >> "$OUTPUT_FILE"
    done
    
    echo "---" >> "$OUTPUT_FILE"
}

# Find and process all .tsx files in packages/
echo "Processing packages/ directory..." >> "$OUTPUT_FILE"
echo "=================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

find packages/ -name "*.tsx" -type f 2>/dev/null | while read -r file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    extract_imports "$file"
done

# Find and process all .jsx files in packages/
find packages/ -name "*.jsx" -type f 2>/dev/null | while read -r file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    extract_imports "$file"
done

echo "" >> "$OUTPUT_FILE"
echo "Processing apps/ directory..." >> "$OUTPUT_FILE"
echo "=============================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Find and process all .tsx files in apps/
find apps/ -name "*.tsx" -type f 2>/dev/null | while read -r file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    extract_imports "$file"
done

# Find and process all .jsx files in apps/
find apps/ -name "*.jsx" -type f 2>/dev/null | while read -r file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    extract_imports "$file"
done

echo "Analysis complete. Results saved to $OUTPUT_FILE"