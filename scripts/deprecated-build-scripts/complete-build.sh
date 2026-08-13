#!/bin/bash

# Set to fail on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting comprehensive build process...${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Dependencies installed successfully!${NC}"
else
  echo -e "${RED}Failed to install dependencies.${NC}"
  exit 1
fi

# Step 2: Build ui-components package first
echo -e "${YELLOW}Building ui-components package...${NC}"
pnpm turbo run build

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All packages built successfully!${NC}"
else
  echo -e "${RED}Failed to build all packages.${NC}"
  exit 1
fi

echo -e "${GREEN}Build process completed successfully!${NC}"