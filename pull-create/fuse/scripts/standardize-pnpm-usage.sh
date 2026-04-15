#!/bin/bash

# Standardize pnpm usage across the entire codebase
# This script replaces npm/yarn commands with pnpm equivalents

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Standardizing pnpm Usage${NC}"
echo -e "${GREEN}==================================${NC}"

# Function to replace yarn/npm commands with pnpm
replace_package_manager_commands() {
    local file="$1"
    local changes=0

    # Skip node_modules, .git, dist, build directories
    if [[ "$file" == *"/node_modules/"* ]] || \
       [[ "$file" == *"/.git/"* ]] || \
       [[ "$file" == *"/dist/"* ]] || \
       [[ "$file" == *"/build/"* ]] || \
       [[ "$file" == *"pnpm-lock.yaml"* ]]; then
        return 0
    fi

    # Create a temporary file
    local temp_file=$(mktemp)

    # Replace yarn commands with pnpm equivalents
    sed -E \
        -e 's/\byarn install\b/pnpm install/g' \
        -e 's/\byarn add\b/pnpm add/g' \
        -e 's/\byarn remove\b/pnpm remove/g' \
        -e 's/\byarn build\b/pnpm run build/g' \
        -e 's/\byarn test\b/pnpm run test/g' \
        -e 's/\byarn start\b/pnpm run start/g' \
        -e 's/\byarn dev\b/pnpm run dev/g' \
        -e 's/\byarn run build\b/pnpm run build/g' \
        -e 's/\byarn run test\b/pnpm run test/g' \
        -e 's/\byarn run start\b/pnpm run start/g' \
        -e 's/\byarn run dev\b/pnpm run dev/g' \
        "$file" > "$temp_file"

    # Check if there were any changes
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo -e "${YELLOW}Updated: $file${NC}"
        changes=1
    else
        rm "$temp_file"
    fi

    return $changes
}

# Counter for modified files
total_modified=0

echo -e "\n${YELLOW}Phase 1: Updating Shell Scripts (.sh)${NC}"
while IFS= read -r -d '' file; do
    if replace_package_manager_commands "$file"; then
        ((total_modified++))
    fi
done < <(find . -name "*.sh" -type f -print0)

echo -e "\n${YELLOW}Phase 2: Updating Markdown Documentation (.md)${NC}"
while IFS= read -r -d '' file; do
    if replace_package_manager_commands "$file"; then
        ((total_modified++))
    fi
done < <(find . -name "*.md" -type f -print0)

echo -e "\n${YELLOW}Phase 3: Updating JSON files (package.json, etc.)${NC}"
while IFS= read -r -d '' file; do
    # For JSON files, only update scripts that reference yarn
    if grep -q "yarn" "$file" 2>/dev/null; then
        if replace_package_manager_commands "$file"; then
            ((total_modified++))
        fi
    fi
done < <(find . -name "package.json" -type f -print0)

echo -e "\n${YELLOW}Phase 4: Updating GitHub Workflow files (.yml)${NC}"
while IFS= read -r -d '' file; do
    # Skip bun-specific workflows or add special handling if needed
    if grep -q "yarn\|npm install\|npm run" "$file" 2>/dev/null; then
        # For workflow files, we need to be more careful
        # Replace npm/yarn but keep npm install -g pnpm
        temp_file=$(mktemp)
        sed -E \
            -e '/npm install -g pnpm/!s/\bnpm install\b/pnpm install/g' \
            -e '/npm install -g/!s/\bnpm run\b/pnpm run/g' \
            -e 's/\byarn install\b/pnpm install/g' \
            -e 's/\byarn run\b/pnpm run/g' \
            "$file" > "$temp_file"

        if ! cmp -s "$file" "$temp_file"; then
            mv "$temp_file" "$file"
            echo -e "${YELLOW}Updated: $file${NC}"
            ((total_modified++))
        else
            rm "$temp_file"
        fi
    fi
done < <(find .github/workflows -name "*.yml" -type f -print0 2>/dev/null || true)

echo -e "\n${YELLOW}Phase 5: Updating TypeScript/JavaScript files (.ts, .tsx, .js)${NC}"
while IFS= read -r -d '' file; do
    # Only update files that have yarn/npm command references (like in code comments or strings)
    if grep -qE "(yarn|npm) (install|run|build|test)" "$file" 2>/dev/null; then
        if replace_package_manager_commands "$file"; then
            ((total_modified++))
        fi
    fi
done < <(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" \) -type f -print0)

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}Summary${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "Total files modified: ${GREEN}${total_modified}${NC}"
echo -e "\n${YELLOW}Note: The following are intentionally kept:${NC}"
echo -e "  - 'npm install -g pnpm' in Dockerfiles (required to install pnpm)"
echo -e "  - Files in node_modules, .git, dist, and build directories"

echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "1. Review the changes with: ${YELLOW}git diff${NC}"
echo -e "2. Run: ${YELLOW}pnpm install${NC} to ensure lockfile is up to date"
echo -e "3. Run: ${YELLOW}pnpm run build${NC} to test the build"
echo -e "4. Commit changes: ${YELLOW}git add . && git commit -m 'chore: standardize pnpm usage across codebase'${NC}"

exit 0
