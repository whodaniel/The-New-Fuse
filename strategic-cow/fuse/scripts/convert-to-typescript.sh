#!/bin/bash

# Set color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default configuration
TARGET_DIR="."
SKIP_TESTS=false
DRY_RUN=false
BACKUP=true

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dir=*) TARGET_DIR="${1#*=}" ;;
        --skip-tests) SKIP_TESTS=true ;;
        --dry-run) DRY_RUN=true ;;
        --no-backup) BACKUP=false ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${GREEN}Starting TypeScript conversion...${NC}"

# Create backup if enabled
if [ "$BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Creating backup in $BACKUP_DIR...${NC}"
    mkdir -p "$BACKUP_DIR"
    cp -r "$TARGET_DIR" "$BACKUP_DIR/"
fi

# Function to detect React usage in a file
detect_react_usage() {
    local file="$1"
    if grep -l "React\|useState\|useEffect\|JSX" "$file" > /dev/null 2>&1; then
        echo "tsx"
    else
        echo "ts"
    fi
}

# Function to convert a single file
convert_file() {
    local file="$1"
    local dir=$(dirname "$file")
    local base=$(basename "$file")
    local ext=$(detect_react_usage "$file")
    local new_file="${dir}/${base%.js}.${ext}"
    
    # Skip node_modules, dist, and backup directories
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]] || [[ "$file" == *"backup_"* ]]; then
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        echo "Would convert $file to $new_file"
    else
        echo "Converting $file to $new_file"
        
        # Add type annotations where possible
        sed -i.bak -e 's/function \([a-zA-Z0-9_]*\)(/function \1(): void|any {/' \
            -e 's/const \([a-zA-Z0-9_]*\) = (/const \1 = (): void|any => {/' \
            -e 's/\([a-zA-Z0-9_]*\): function(/\1(): void|any {/' "$file"
        
        # Move file to new extension
        mv "$file" "$new_file"
        rm -f "${file}.bak"
        
        # Update imports if it's a TSX file
        if [ "$ext" = "tsx" ]; then
            sed -i.bak -e 's/from "react"/from "react";/' \
                -e 's/import React/import * as React/' "$new_file"
            rm -f "${new_file}.bak"
        fi
    fi
}

# Find and convert all JavaScript files
echo -e "${YELLOW}Scanning for JavaScript files in $TARGET_DIR...${NC}"
FOUND_FILES=$(find "$TARGET_DIR" -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/backup_*/*")
FILE_COUNT=$(echo "$FOUND_FILES" | wc -l)

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Found $FILE_COUNT files to convert (dry run)${NC}"
else
    echo -e "${YELLOW}Converting $FILE_COUNT files...${NC}"
fi

echo "$FOUND_FILES" | while read -r file; do
    convert_file "$file"
done

# Update tsconfig.json if it exists
if [ -f "tsconfig.json" ] && [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}Updating tsconfig.json...${NC}"
    # Add JSX support and strict type checking
    sed -i.bak -E 's/"compilerOptions": \{/"compilerOptions": \{\n    "jsx": "react",\n    "strict": true,/' tsconfig.json
    rm -f tsconfig.json.bak
fi

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ] && [ "$DRY_RUN" = false ]; then
    echo -e "${GREEN}Running tests to verify conversion...${NC}"
    if yarn test; then
        echo -e "${GREEN}All tests passed!${NC}"
    else
        echo -e "${RED}Tests failed! You may need to fix type errors manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}TypeScript conversion completed!${NC}"
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Review converted files for any necessary type annotations"
    echo "2. Run 'yarn tsc' to check for type errors"
    echo "3. Update any remaining 'require()' statements to 'import'"
    echo "4. Add missing type definitions for external modules"
fi