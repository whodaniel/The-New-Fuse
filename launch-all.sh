#!/bin/bash
# Master execution script for The New Fuse project
# This script builds and launches all components

# Exit on error
set -e

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BOLD}${GREEN}🚀 THE NEW FUSE - COMPLETE PROJECT LAUNCH${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Function to check if Docker is running
check_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running! Please start Docker first.${NC}"
    exit 1
  fi
}

# Function to kill processes on specific ports
kill_port_processes() {
  echo -e "${YELLOW}Killing processes on development ports...${NC}"
  node ./scripts/kill-port-processes.js || echo "No processes to kill"
}

# Step 1: Kill any processes using our development ports
echo -e "\n${CYAN}${BOLD}STEP 1: PREPARING ENVIRONMENT${NC}"
kill_port_processes

# Step 2: Check Docker status
echo -e "\n${CYAN}${BOLD}STEP 2: VERIFYING DOCKER${NC}"
check_docker

# Step 3: Build all packages (using comprehensive build)
echo -e "\n${CYAN}${BOLD}STEP 3: BUILDING ALL PACKAGES${NC}"
echo -e "${YELLOW}Running comprehensive build script...${NC}"
chmod +x ./comprehensive-build.sh
./comprehensive-build.sh

# Step 4: Build Chrome Extension
echo -e "\n${CYAN}${BOLD}STEP 4: BUILDING CHROME EXTENSION${NC}"
echo -e "${YELLOW}Building Chrome Extension...${NC}"
cd "$SCRIPT_DIR/chrome-extension"
chmod +x ./build.sh
./build.sh
cd "$SCRIPT_DIR"

# Step 5: Build VS Code Extension
echo -e "\n${CYAN}${BOLD}STEP 5: BUILDING VSCODE EXTENSION${NC}"
echo -e "${YELLOW}Building VS Code Extension...${NC}"
cd "$SCRIPT_DIR/src/vscode-extension"

# Update version number
VERSION=$(node -p "(require('./package.json').version || '0.0.1').split('.')")
MAJOR=$(echo $VERSION | cut -d, -f1)
MINOR=$(echo $VERSION | cut -d, -f2)
PATCH=$(echo $VERSION | cut -d, -f3)
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
echo -e "${YELLOW}Incrementing VS Code extension version to ${NEW_VERSION}${NC}"

# Use jq to update package.json
if command -v jq &> /dev/null; then
  cat package.json | jq ".version = \"$NEW_VERSION\"" > package.json.tmp
  mv package.json.tmp package.json
else
  echo -e "${YELLOW}jq not found, skipping version update${NC}"
fi

chmod +x ./build-vsix.sh
./build-vsix.sh
cd "$SCRIPT_DIR"

# Step 6: Start Docker services
echo -e "\n${CYAN}${BOLD}STEP 6: STARTING DOCKER SERVICES${NC}"
echo -e "${YELLOW}Starting Docker services...${NC}"
docker compose down --remove-orphans
docker compose up -d

# Step 7: Launch WebSocket server for communication
echo -e "\n${CYAN}${BOLD}STEP 7: LAUNCHING WEBSOCKET SERVER${NC}"
echo -e "${YELLOW}Starting WebSocket server...${NC}"
cd "$SCRIPT_DIR"
node test-websocket-server-3711.cjs &
WEBSOCKET_PID=$!

# Step 8: Start Redis monitoring (if available)
echo -e "\n${CYAN}${BOLD}STEP 8: CONFIGURING REDIS${NC}"
if command -v redis-cli &> /dev/null; then
  echo -e "${YELLOW}Setting up Redis monitoring...${NC}"
  redis-cli ping >/dev/null 2>&1 || echo "Redis not responding. Using Docker Redis instance."
fi

# Step 9: Launch React UI in Chrome
echo -e "\n${CYAN}${BOLD}STEP 9: LAUNCHING UI IN BROWSER${NC}"
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 10
echo -e "${GREEN}Opening browser to view frontend UI...${NC}"
case "$(uname)" in
  "Darwin") # macOS
    open "http://localhost:3000"
    ;;
  "Linux")
    if command -v xdg-open > /dev/null; then
      xdg-open "http://localhost:3000"
    else
      echo "❓ Could not automatically open browser. Please open http://localhost:3000 manually."
    fi
    ;;
  *)
    echo "❓ Could not automatically open browser. Please open http://localhost:3000 manually."
    ;;
esac

echo -e "\n${GREEN}${BOLD}==============================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 THE NEW FUSE PROJECT LAUNCHED SUCCESSFULLY!${NC}"
echo -e "${GREEN}${BOLD}==============================================================${NC}"
echo -e "${BLUE}Frontend UI:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:3002"
echo -e "${BLUE}API Service:${NC} http://localhost:3001"
echo -e "${BLUE}WebSocket Server:${NC} ws://localhost:3711"
echo -e "${BLUE}Redis:${NC} localhost:6379"
echo -e ""
echo -e "${YELLOW}Chrome Extension:${NC} Load unpacked from $SCRIPT_DIR/chrome-extension/dist"
echo -e "${YELLOW}VS Code Extension:${NC} Install from $SCRIPT_DIR/src/vscode-extension/*.vsix"
echo -e ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Capture Ctrl+C and cleanup
cleanup() {
  echo -e "\n${RED}Shutting down services...${NC}"
  kill $WEBSOCKET_PID 2>/dev/null || true
  docker compose down
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup INT

# Keep script running
while true; do
  sleep 1
done
