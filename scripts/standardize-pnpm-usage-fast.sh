#!/bin/bash

# Fast standardize pnpm usage across the entire codebase

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Standardizing pnpm Usage (Fast)${NC}"

# Use find with grep to only process files that contain yarn or npm commands
echo -e "\n${YELLOW}Finding files with yarn/npm references...${NC}"

# Shell scripts
echo -e "${YELLOW}Updating Shell Scripts...${NC}"
find . -name "*.sh" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" -exec grep -l '\(yarn\|npm\) \(install\|run\|build\|test\|start\|dev\|add\|remove\)' {} \; 2>/dev/null | while read file; do
    sed -i.bak -E \
        -e 's/\byarn install\b/pnpm install/g' \
        -e 's/\byarn add\b/pnpm add/g' \
        -e 's/\byarn remove\b/pnpm remove/g' \
        -e 's/\byarn build\b/pnpm run build/g' \
        -e 's/\byarn test\b/pnpm run test/g' \
        -e 's/\byarn start\b/pnpm run start/g' \
        -e 's/\byarn dev\b/pnpm run dev/g' \
        -e 's/\byarn run ([a-zA-Z0-9:-]+)\b/pnpm run \1/g' \
        "$file" && rm "${file}.bak" && echo "  Updated: $file"
done

# Markdown files
echo -e "${YELLOW}Updating Markdown Documentation...${NC}"
find . -name "*.md" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" -exec grep -l '\(yarn\|npm\) \(install\|run\|build\|test\|start\|dev\|add\)' {} \; 2>/dev/null | while read file; do
    sed -i.bak -E \
        -e 's/\byarn install\b/pnpm install/g' \
        -e 's/\byarn add\b/pnpm add/g' \
        -e 's/\byarn build\b/pnpm run build/g' \
        -e 's/\byarn test\b/pnpm run test/g' \
        -e 's/\byarn start\b/pnpm run start/g' \
        -e 's/\byarn dev\b/pnpm run dev/g' \
        -e 's/\byarn run ([a-zA-Z0-9:-]+)\b/pnpm run \1/g' \
        -e 's/npm run ([a-zA-Z0-9:-]+)\b/pnpm run \1/g' \
        "$file" && rm "${file}.bak" && echo "  Updated: $file"
done

# Workflow files
echo -e "${YELLOW}Updating GitHub Workflows...${NC}"
if [ -d ".github/workflows" ]; then
    find .github/workflows -name "*.yml" -type f -exec grep -l '\(yarn\|npm\) \(install\|run\)' {} \; 2>/dev/null | while read file; do
        # Skip npm install -g pnpm
        sed -i.bak -E \
            -e '/npm install -g pnpm/!s/\bnpm install\b/pnpm install/g' \
            -e '/npm install -g/!s/\bnpm run ([a-zA-Z0-9:-]+)\b/pnpm run \1/g' \
            -e 's/\byarn install\b/pnpm install/g' \
            -e 's/\byarn run ([a-zA-Z0-9:-]+)\b/pnpm run \1/g' \
            "$file" && rm "${file}.bak" && echo "  Updated: $file"
    done
fi

# TypeScript/JavaScript files (comments and strings)
echo -e "${YELLOW}Updating TS/JS files...${NC}"
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" \) -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" -exec grep -l '\(yarn\|npm\) \(install\|run\|build\)' {} \; 2>/dev/null | head -20 | while read file; do
    sed -i.bak -E \
        -e 's/yarn install/pnpm install/g' \
        -e 's/yarn run ([a-zA-Z0-9:-]+)/pnpm run \1/g' \
        -e 's/npm run ([a-zA-Z0-9:-]+)/pnpm run \1/g' \
        "$file" && rm "${file}.bak" && echo "  Updated: $file"
done

echo -e "\n${GREEN}Done! Run 'git diff' to review changes${NC}"
