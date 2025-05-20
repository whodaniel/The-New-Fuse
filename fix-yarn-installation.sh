#!/bin/bash

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Starting The New Fuse installation fix...${NC}"

# Step 1: Clean up existing installation
echo -e "${YELLOW}Step 1: Cleaning up existing installation...${NC}"
# Remove node_modules directories
echo -e "🗑️  Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Remove build artifacts
echo -e "🗑️  Removing build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".turbo" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "out" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Remove yarn cache
echo -e "🗑️  Removing yarn cache..."
rm -rf .yarn/cache .yarn/unplugged .yarn/build-state.yml .yarn/install-state.gz 2>/dev/null || true

# Remove lock files
echo -e "🗑️  Removing lock files..."
find . -name "yarn.lock" -type f -delete 2>/dev/null || true
find . -name "package-lock.json" -type f -delete 2>/dev/null || true

# Step 2: Update package.json to use exact version for ts-node
echo -e "${YELLOW}Step 2: Updating package.json with exact version for ts-node...${NC}"
# First, check if ts-node is already in the devDependencies
if grep -q '"ts-node":' package.json; then
  # Update the version to an exact version
  sed -i '' 's/"ts-node": "\^10.9.[0-9]"/"ts-node": "10.9.1"/g' package.json
else
  # Add ts-node to devDependencies if it doesn't exist
  sed -i '' '/"typescript": "\^[0-9].[0-9].[0-9]"/a\\    "ts-node": "10.9.1",' package.json
fi

# Make sure ts-node is in resolutions
if ! grep -q '"ts-node":' package.json | grep -q "resolutions"; then
  # Add ts-node to resolutions if it doesn't exist
  sed -i '' '/"typescript": "\^[0-9].[0-9].[0-9]"/a\\    "ts-node": "10.9.1",' package.json
fi

# Step 3: Install yarn globally with the correct version
echo -e "${YELLOW}Step 3: Installing yarn globally with the correct version...${NC}"
npm install -g yarn@3.6.3

# Step 4: Initialize yarn
echo -e "${YELLOW}Step 4: Initializing yarn...${NC}"
yarn set version 3.6.3

# Step 5: Install dependencies
echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
echo -e "This may take a while. Please be patient..."
yarn install --network-timeout 300000

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Installation completed successfully!${NC}"
else
  echo -e "${RED}❌ Installation failed. Trying alternative approach...${NC}"
  
  # Alternative approach: Use npm instead
  echo -e "${YELLOW}Trying npm installation instead...${NC}"
  npm install
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ npm installation completed successfully!${NC}"
  else
    echo -e "${RED}❌ Both yarn and npm installations failed.${NC}"
    echo -e "${YELLOW}Please try the following manual steps:${NC}"
    echo -e "1. Make sure you have the correct version of Node.js installed (v16 or higher)"
    echo -e "2. Run: npm install -g yarn@3.6.3"
    echo -e "3. Delete node_modules and yarn.lock"
    echo -e "4. Run: yarn install --network-timeout 300000"
  fi
fi

echo -e "${GREEN}Process completed.${NC}"
