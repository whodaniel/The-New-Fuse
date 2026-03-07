#!/bin/bash

# Set color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Docker cleanup process...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Stop containers
echo -e "${YELLOW}Stopping running containers related to the project...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# Check for running containers with project name pattern
PROJECT_CONTAINERS=$(docker ps --filter "name=fuse" -q)
if [ ! -z "$PROJECT_CONTAINERS" ]; then
    echo -e "${YELLOW}Stopping project-related containers...${NC}"
    docker stop $PROJECT_CONTAINERS
fi

# Remove stopped containers with project name pattern
echo -e "${YELLOW}Removing stopped containers related to the project...${NC}"
STOPPED_CONTAINERS=$(docker ps -a --filter "name=fuse" -q)
if [ ! -z "$STOPPED_CONTAINERS" ]; then
    docker rm $STOPPED_CONTAINERS 2>/dev/null || true
fi

# Remove project images
echo -e "${YELLOW}Removing project-related Docker images...${NC}"
PROJECT_IMAGES=$(docker images "*fuse*" -q)
if [ ! -z "$PROJECT_IMAGES" ]; then
    docker rmi $PROJECT_IMAGES 2>/dev/null || true
fi

# Remove dangling images
echo -e "${YELLOW}Removing dangling images...${NC}"
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ ! -z "$DANGLING_IMAGES" ]; then
    docker rmi $DANGLING_IMAGES 2>/dev/null || true
fi

# Remove project volumes
echo -e "${YELLOW}Removing project volumes...${NC}"
PROJECT_VOLUMES=$(docker volume ls --filter "name=fuse" -q)
if [ ! -z "$PROJECT_VOLUMES" ]; then
    docker volume rm $PROJECT_VOLUMES 2>/dev/null || true
fi

# Prune networks
echo -e "${YELLOW}Pruning unused networks...${NC}"
docker network prune -f

echo -e "${GREEN}Docker cleanup complete!${NC}"