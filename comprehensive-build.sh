#!/bin/bash

# Exit on error
set -e

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Comprehensive Build Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Kill any processes using our development ports
echo -e "\n${YELLOW}Step 1: Clearing ports and processes${NC}"
node ./scripts/kill-port-processes.js || echo "No processes to kill"

# Step 2: Clean previous builds
echo -e "\n${YELLOW}Step 2: Cleaning previous builds${NC}"
yarn clean:build || echo "No previous builds to clean"

# Step 3: Install dependencies if needed
echo -e "\n${YELLOW}Step 3: Installing dependencies${NC}"
yarn install || echo "Dependencies already installed"

# Step 4: Build core packages first
echo -e "\n${YELLOW}Step 4: Building core packages${NC}"
echo -e "${BLUE}Building types package...${NC}"
cd packages/types && yarn build && cd ../..
echo -e "${BLUE}Building api-types package...${NC}"
cd packages/api-types && yarn build && cd ../..
echo -e "${BLUE}Building utils package...${NC}"
cd packages/utils && yarn build && cd ../..
echo -e "${BLUE}Building shared package...${NC}"
cd packages/shared && yarn build && cd ../..
echo -e "${BLUE}Building features package...${NC}"
cd packages/features && yarn build && cd ../..
echo -e "${BLUE}Building core package...${NC}"
cd packages/core && yarn build && cd ../..

# Step 5: Build API and client packages
echo -e "\n${YELLOW}Step 5: Building API and client packages${NC}"
echo -e "${BLUE}Building API package...${NC}"
cd packages/api && yarn build && cd ../..
echo -e "${BLUE}Building client package...${NC}"
cd packages/client && yarn build && cd ../..
echo -e "${BLUE}Building hooks package...${NC}"
cd packages/hooks && yarn build && cd ../..

# Step 6: Build API server
echo -e "\n${YELLOW}Step 6: Building API server${NC}"
echo -e "${BLUE}Building API server...${NC}"
cd apps/api && yarn build && cd ../..

# Step 7: Build backend
echo -e "\n${YELLOW}Step 7: Building backend server${NC}"
echo -e "${BLUE}Building backend server...${NC}"
cd apps/backend && yarn build && cd ../..

# Step 8: Build frontend
echo -e "\n${YELLOW}Step 8: Building frontend application${NC}"
echo -e "${BLUE}Building frontend application...${NC}"
cd apps/frontend && yarn build && cd ../..
cd apps/api && yarn build && cd ../..

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Comprehensive build complete!${NC}"
echo -e "${GREEN}========================================${NC}"
