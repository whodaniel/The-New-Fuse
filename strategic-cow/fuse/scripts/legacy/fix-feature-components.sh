#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Starting TypeScript feature components fix..."

# Find all .ts files in feature components directories
find ./packages/features/*/components -type f -name "*.ts" | while read -r file; do
    # Skip .d.ts files
    if [[ $file == *.d.ts ]]; then
        continue
    fi

    # Check if file contains JSX syntax
    if grep -l "React\|JSX\|<.*>\|<\/.*>" "$file" > /dev/null; then
        echo -e "${YELLOW}Converting${NC} $file to .tsx..."
        
        # Add React import if missing
        if ! grep -q "import.*React" "$file"; then
            sed -i '' '1i\
import React from "react";\
' "$file"
        fi

        # Add FC type if it's a functional component
        sed -i '' 's/export const \([A-Za-z]*\) = (/export const \1: React.FC = (/g' "$file"
        
        # Rename file to .tsx
        mv "$file" "${file%.*}.tsx"
        echo -e "${GREEN}Converted${NC} ${file%.*}.tsx"
    fi
done

# Fix common TypeScript errors in all .tsx files
find ./packages/features/*/components -type f -name "*.tsx" | while read -r file; do
    echo "Fixing TypeScript issues in $file..."
    
    # Add missing React imports
    if ! grep -q "import.*React" "$file"; then
        sed -i '' '1i\
import React from "react";\
' "$file"
    fi
    
    # Replace arrow functions with proper FC type annotations
    sed -i '' 's/export const \([A-Za-z]*\) = (/export const \1: React.FC = (/g' "$file"
    
    # Add return type annotations to functions
    sed -i '' 's/function \([A-Za-z]*\)(/function \1(): JSX.Element /g' "$file"
    
    echo -e "${GREEN}Fixed${NC} $file"
done

echo -e "\n${GREEN}Completed TypeScript fixes!${NC}"
echo "Please run 'tsc' to verify remaining errors."