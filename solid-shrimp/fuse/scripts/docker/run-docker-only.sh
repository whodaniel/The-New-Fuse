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
echo -e "${GREEN}The New Fuse - Docker Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Kill any processes using our development ports
echo -e "\n${YELLOW}Step 1: Clearing ports and processes${NC}"
node ./scripts/kill-port-processes.js || echo "No processes to kill"

# Step 2: Check if Docker is running
echo -e "\n${YELLOW}Step 2: Checking Docker daemon${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker first.${NC}"
    exit 1
fi

# Step 3: Check Docker ports
echo -e "\n${YELLOW}Step 3: Checking Docker port availability${NC}"
node ./scripts/check-docker-ports.js || echo "Proceeding anyway..."

# Step 4: Stop any running containers
echo -e "\n${YELLOW}Step 4: Stopping any existing containers${NC}"
docker-compose down --remove-orphans || echo "No containers to stop"

# Step 5: Start the Docker services
echo -e "\n${YELLOW}Step 5: Starting Docker services${NC}"
docker-compose up -d

# Step 6: Show container status
echo -e "\n${YELLOW}Step 6: Checking container status${NC}"
docker-compose ps

# Step 7: Show logs
echo -e "\n${YELLOW}Step 7: Display startup logs${NC}"
docker-compose logs

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Docker services started successfully!${NC}"
echo -e "${BLUE}Access the UI at: http://localhost:3000${NC}"
echo -e "${BLUE}API is available at: http://localhost:3001${NC}"
echo -e "${BLUE}Backend is available at: http://localhost:3002${NC}"
echo -e "${GREEN}========================================${NC}"
