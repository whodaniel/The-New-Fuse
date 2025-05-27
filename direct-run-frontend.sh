#!/bin/bash
# Script to directly run the frontend service without Docker

# Exit on error
set -e

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Direct Frontend Launcher${NC}"
echo -e "${BLUE}========================================${NC}"

# Build core packages if needed
echo -e "${YELLOW}Step 1: Building core packages${NC}"

# Navigate to the frontend app directory
cd "$SCRIPT_DIR/apps/frontend"

# Install dependencies if needed
echo -e "${YELLOW}Step 2: Ensuring dependencies are installed${NC}"
yarn install

# Build and start the frontend
echo -e "${YELLOW}Step 3: Starting the frontend service${NC}"
echo -e "${BLUE}Running frontend in development mode...${NC}"
yarn dev

# This will start the frontend on port 3000
echo -e "${GREEN}Frontend started on http://localhost:3000${NC}"
