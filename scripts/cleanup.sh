#!/bin/bash

# Set color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting cleanup process...${NC}"

# Clean Yarn cache
echo -e "\n${GREEN}Cleaning Yarn cache...${NC}"
yarn cache clean
rm -rf .yarn/cache
rm -rf .yarn/build-state.yml
rm -rf .yarn/install-state.gz

# Clean node_modules
echo -e "\n${GREEN}Removing node_modules...${NC}"
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clean TypeScript cache
echo -e "\n${GREEN}Cleaning TypeScript cache...${NC}"
find . -name ".tsbuildinfo" -type f -delete
find . -name "tsconfig.tsbuildinfo" -type f -delete

# Clean build artifacts
echo -e "\n${GREEN}Cleaning build artifacts...${NC}"
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +

# Clean Docker
echo -e "\n${GREEN}Cleaning Docker...${NC}"
if command -v docker &> /dev/null; then
    echo "Stopping all containers..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    echo "Removing all containers..."
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    echo "Removing all images..."
    docker rmi $(docker images -q) 2>/dev/null || true
    
    echo "Removing all volumes..."
    docker volume rm $(docker volume ls -q) 2>/dev/null || true
    
    echo "Pruning system..."
    docker system prune -af --volumes
else
    echo -e "${RED}Docker is not installed${NC}"
fi

echo -e "\n${GREEN}Cleanup complete!${NC}"
echo -e "${GREEN}Run 'yarn install' to reinstall dependencies${NC}"