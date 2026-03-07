#!/bin/bash
# Script to rebuild everything from scratch and run with Docker

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Complete Rebuild & Run${NC}"
echo -e "${BLUE}========================================${NC}"

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if user wants to rebuild everything
echo -e "${YELLOW}This script will rebuild everything from scratch and restart all services.${NC}"
echo -e "${RED}This will take some time and may temporarily stop running services.${NC}"
read -p "Continue? (y/n): " choice

if [[ ! "$choice" =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Operation cancelled.${NC}"
  exit 0
fi

echo -e "\n${YELLOW}Step 1: Stopping any running containers${NC}"
docker compose down --remove-orphans || echo "No containers to stop"

echo -e "\n${YELLOW}Step 2: Cleaning up Docker resources${NC}"
# Remove named volumes and images related to the project
# Uncomment the following lines to perform a deep clean (can be destructive)
# docker system prune -f
# docker volume prune -f

echo -e "\n${YELLOW}Step 3: Building all packages in correct order${NC}"
./comprehensive-build.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 4: Running tests${NC}"
# Uncomment the following line if you want to run tests before deploying
# yarn test || echo "Tests completed with warnings or failures."

echo -e "\n${YELLOW}Step 5: Starting Docker services${NC}"
docker compose up -d --build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Docker services failed to start. Please check the errors above.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 6: Checking service status${NC}"
sleep 10
docker compose ps

echo -e "\n${GREEN}✅ Rebuild and restart completed successfully.${NC}"
echo -e "${BLUE}Access the UI at: http://localhost:3000${NC}"
echo -e "${BLUE}API is available at: http://localhost:3001${NC}"
echo -e "${BLUE}Backend is available at: http://localhost:3002${NC}"
echo -e "\n${YELLOW}To view logs, run:${NC}"
echo -e "${BLUE}./view-logs.sh${NC}"
