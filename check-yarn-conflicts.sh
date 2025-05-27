#!/bin/bash
# Script to check for and handle any remaining potential Yarn conflicts

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Checking for remaining Yarn version conflicts...${NC}"

# 1. Check current Yarn version
echo -e "${YELLOW}Current Yarn version:${NC}"
yarn --version

# 2. Check if local project version matches expected
if [ -f ".yarn/releases/yarn-4.9.1.cjs" ]; then
  echo -e "${GREEN}✅ Local project Yarn version 4.9.1 found.${NC}"
else
  echo -e "${RED}❌ Local project Yarn 4.9.1 not found. Installing...${NC}"
  
  # Use corepack to install the correct version
  if command -v corepack &>/dev/null; then
    corepack prepare yarn@4.9.1 --activate
  else
    npm install -g corepack
    corepack prepare yarn@4.9.1 --activate
  fi
fi

# 3. Check if packageManager field in package.json is correct
if grep -q '"packageManager": "yarn@4.9.1"' package.json; then
  echo -e "${GREEN}✅ package.json packageManager field is correct.${NC}"
else
  echo -e "${YELLOW}⚠️ Updating packageManager field in package.json...${NC}"
  # This is a simplistic approach - in a real scenario, use a JSON parser
  sed -i '' 's/"packageManager": "[^"]*"/"packageManager": "yarn@4.9.1"/g' package.json
fi

# 4. Check for Yarn version references in project files (excluding node_modules)
echo -e "${YELLOW}Checking for references to other Yarn versions in project files...${NC}"
FOUND_FILES=$(grep -r "yarn@[0-9]" --include="*.{json,sh,js,ts}" --exclude-dir={node_modules,.git,.yarn} . || true)

if [ -n "$FOUND_FILES" ]; then
  echo -e "${YELLOW}⚠️ Found the following files with Yarn version references:${NC}"
  echo "$FOUND_FILES"
  echo -e "${YELLOW}These might need manual review.${NC}"
else
  echo -e "${GREEN}✅ No explicit references to other Yarn versions found in project files.${NC}"
fi

# 5. Create .yarnrc.yml if it doesn't exist (or is incorrect)
if [ ! -f ".yarnrc.yml" ] || ! grep -q "yarnPath: .yarn/releases/yarn-4.9.1.cjs" .yarnrc.yml; then
  echo -e "${YELLOW}⚠️ Creating/updating .yarnrc.yml...${NC}"
  
  # Create or overwrite .yarnrc.yml
  cat > .yarnrc.yml << EOL
compressionLevel: mixed

enableGlobalCache: true

nmMode: hardlinks-local

nodeLinker: node-modules

yarnPath: .yarn/releases/yarn-4.9.1.cjs
EOL

  echo -e "${GREEN}✅ Created/updated .yarnrc.yml${NC}"
else
  echo -e "${GREEN}✅ .yarnrc.yml has correct yarnPath.${NC}"
fi

# 6. Update any shell scripts with direct Yarn version references
echo -e "${YELLOW}Checking shell scripts for direct Yarn version references...${NC}"
SHELL_SCRIPTS_WITH_VERSION=$(grep -r "yarn@[0-9]" --include="*.sh" --exclude-dir={node_modules,.git,.yarn} . || true)

if [ -n "$SHELL_SCRIPTS_WITH_VERSION" ]; then
  echo -e "${YELLOW}⚠️ Found shell scripts with direct Yarn version references:${NC}"
  echo "$SHELL_SCRIPTS_WITH_VERSION"
  echo -e "${YELLOW}Recommend manual review of these scripts.${NC}"
else
  echo -e "${GREEN}✅ No direct Yarn version references found in shell scripts.${NC}"
fi

# 7. Final message
echo -e "${GREEN}✅ Yarn configuration check complete.${NC}"
echo -e "${YELLOW}Recommendation: Run './use-project-yarn.sh install' to reinstall dependencies with the correct Yarn version.${NC}"
