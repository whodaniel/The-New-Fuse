#!/bin/bash

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Starting lockfile fix...${NC}"

# Step 1: Remove existing lockfile and node_modules
echo -e "${YELLOW}Step 1: Removing existing lockfile and node_modules...${NC}"
rm -f yarn.lock
rm -rf node_modules
rm -rf .yarn/cache .yarn/install-state.gz .yarn/build-state.yml

# Step 2: Create a fresh .yarnrc.yml file
echo -e "${YELLOW}Step 2: Creating a fresh .yarnrc.yml file...${NC}"
cat > .yarnrc.yml << EOF
nodeLinker: node-modules

enableGlobalCache: false
enableTelemetry: false
enableScripts: true

packageExtensions:
  "@nestjs/jwt@*":
    peerDependencies:
      "@nestjs/common": "^10.4.15"
  "@nestjs/mapped-types@*":
    peerDependencies:
      "@nestjs/common": "^10.4.15"
      "reflect-metadata": "^0.1.14"
  "@nestjs/core@*":
    peerDependencies:
      "@nestjs/common": "^10.4.15"
      "reflect-metadata": "^0.1.14"
  "inversify@*":
    peerDependencies:
      "reflect-metadata": "^0.1.14"

pnpMode: loose
EOF

# Step 3: Update package.json to use exact version for ts-node
echo -e "${YELLOW}Step 3: Updating package.json with exact version for ts-node...${NC}"
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

# Step 4: Try npm install first to get the basic dependencies
echo -e "${YELLOW}Step 4: Installing basic dependencies with npm...${NC}"
npm install --no-package-lock ts-node@10.9.1 typescript@4.9.5

# Step 5: Try yarn install with increased network timeout
echo -e "${YELLOW}Step 5: Running yarn install with increased network timeout...${NC}"
yarn install --network-timeout 300000

echo -e "${GREEN}Process completed. Check if the installation was successful.${NC}"
