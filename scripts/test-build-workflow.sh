#!/bin/bash

# Test script for port management and build workflow
# This script tests all the components of our port management solution

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Build & Port Management Test${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Test port killing script
echo -e "\n${YELLOW}Step 1: Testing port killing script${NC}"
node ./scripts/kill-port-processes.js

# Step 2: Test Docker port checking script
echo -e "\n${YELLOW}Step 2: Testing Docker port checking script${NC}"
node ./scripts/check-docker-ports.js

# Step 3: Test prebuild script
echo -e "\n${YELLOW}Step 3: Testing prebuild script${NC}"
yarn prebuild

# Step 4: Test build script with port clearing
echo -e "\n${YELLOW}Step 4: Testing small build task${NC}"
yarn workspaces foreach -pt --from '@the-new-fuse/shared' run build

# Step 5: Test Docker configuration
echo -e "\n${YELLOW}Step 5: Validating Docker Compose configuration${NC}"
docker-compose config

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All port management and build tests complete!${NC}"
echo -e "${GREEN}========================================${NC}"
