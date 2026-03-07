#!/bin/bash
# Script to view logs from all Docker containers running in The New Fuse project

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Docker Container Logs${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker daemon is not running. Please start Docker first.${NC}"
  exit 1
fi

# Parse arguments
FOLLOW=0
TAIL=50
SERVICE=""

# Process command arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -f|--follow)
      FOLLOW=1
      shift
      ;;
    -t|--tail)
      TAIL="$2"
      shift
      shift
      ;;
    *)
      SERVICE="$1"
      shift
      ;;
  esac
done

# Function to list available services
list_services() {
  echo -e "${YELLOW}Available services:${NC}"
  docker compose ps --services | sort
}

# If a specific service was requested
if [ ! -z "$SERVICE" ]; then
  # Check if the service exists
  if docker compose ps "$SERVICE" &>/dev/null; then
    echo -e "${YELLOW}Showing logs for $SERVICE:${NC}"
    
    if [ "$FOLLOW" -eq 1 ]; then
      echo -e "${BLUE}Following logs... (Press Ctrl+C to exit)${NC}"
      docker compose logs --tail="$TAIL" -f "$SERVICE"
    else
      docker compose logs --tail="$TAIL" "$SERVICE"
    fi
  else
    echo -e "${RED}Service '$SERVICE' not found.${NC}"
    list_services
    exit 1
  fi
else
  # No specific service was requested, show all logs
  echo -e "${YELLOW}Showing logs for all services:${NC}"
  
  if [ "$FOLLOW" -eq 1 ]; then
    echo -e "${BLUE}Following logs... (Press Ctrl+C to exit)${NC}"
    docker compose logs --tail="$TAIL" -f
  else
    docker compose logs --tail="$TAIL"
  fi
  
  echo -e "\n${YELLOW}Tip: To view logs for a specific service, run:${NC}"
  echo -e "${BLUE}./view-logs.sh [service-name]${NC}"
  echo -e "${YELLOW}To follow logs in real-time, use:${NC}"
  echo -e "${BLUE}./view-logs.sh -f [service-name]${NC}"
  echo -e "${YELLOW}To specify number of lines to show, use:${NC}"
  echo -e "${BLUE}./view-logs.sh -t 100 [service-name]${NC}"
  
  echo -e "\n${YELLOW}Available services:${NC}"
  list_services
fi
