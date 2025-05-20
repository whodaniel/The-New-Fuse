#!/bin/bash

# Script to fix workspace dependency protocol issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing npm workspace protocol issues...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found!${NC}"
  exit 1
fi

# Create a backup of the original package.json
# Create a backup of the original package.json
cp package.json package.json.backup || { echo -e "${RED}Error: Failed to create backup!${NC}"; exit 1; }
echo "Created backup: package.json.backup"
echo "Created backup: package.json.backup"

# Replace workspace: dependencies with normal versions
sed -i '' 's/"workspace:\*"/"^1.0.0"/g' package.json
sed -i '' 's/"workspace:^"/"^1.0.0"/g' package.json
sed -i '' 's/"workspace:~"/"^1.0.0"/g' package.json

echo -e "${GREEN}Successfully replaced workspace protocol references with fixed versions.${NC}"
echo "Now installing dev dependencies..."

# Install the required dev dependencies
yarn add --dev @types/passport @faker-js/faker

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}Note: If you're using a monorepo, make sure to restore workspace links after package installation by running:${NC}"
echo -e "    mv package.json.backup package.json"
echo -e "    npm install"
