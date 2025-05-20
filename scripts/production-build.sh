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
echo -e "${GREEN}The New Fuse - Production Build Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Kill any processes using our development ports
echo -e "\n${YELLOW}Step 1: Clearing ports and processes${NC}"
node ./scripts/kill-port-processes.js

# Step 2: Clean previous builds
echo -e "\n${YELLOW}Step 2: Cleaning previous builds${NC}"
yarn clean:build

# Step 3: Run tests
echo -e "\n${YELLOW}Step 3: Running tests${NC}"
yarn test || { 
  echo -e "${RED}Tests failed! Fix before continuing to production build.${NC}"
  exit 1
}

# Step 4: Lint code
echo -e "\n${YELLOW}Step 4: Linting code${NC}"
yarn lint || {
  echo -e "${RED}Linting failed! Fix before continuing to production build.${NC}"
  exit 1
}

# Step 5: Production build
echo -e "\n${YELLOW}Step 5: Creating optimized production builds${NC}"
NODE_ENV=production yarn workspaces foreach -Apt run build

# Step 6: Check Docker ports
echo -e "\n${YELLOW}Step 6: Checking Docker port availability${NC}"
node ./scripts/check-docker-ports.js

# Step 7: Build Docker images
echo -e "\n${YELLOW}Step 7: Building Docker images${NC}"
bash ./scripts/docker-build.sh

# Step 8: Verify Docker services
echo -e "\n${YELLOW}Step 8: Verifying Docker services${NC}"
docker-compose ps

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Production build complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "Deploy using one of the following methods:"
echo -e "1. ${BLUE}docker-compose up -d${NC} (for local deployment)"
echo -e "2. Push images to a container registry"
echo -e "3. Deploy to Kubernetes using the generated manifests"
