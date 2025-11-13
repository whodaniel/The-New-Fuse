#!/bin/bash
# Script to run Docker services and open a browser to view the frontend

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Docker Services & UI Launcher${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Step 1: Checking Docker daemon${NC}"
# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker daemon is not running. Please start Docker first.${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 2: Checking port availability${NC}"
# Check if the required ports are available
if command -v lsof > /dev/null; then
  PORTS_TO_CHECK=(3000 3001 3002 6379 5432)
  for PORT in "${PORTS_TO_CHECK[@]}"; do
    if lsof -i :"$PORT" > /dev/null; then
      echo -e "${RED}⚠️  Warning: Port $PORT is already in use. This might cause conflicts.${NC}"
    else
      echo -e "${GREEN}✅ Port $PORT is available${NC}"
    fi
  done
fi

echo -e "${YELLOW}Step 3: Stopping existing Docker services${NC}"
# Stop any existing containers
docker compose down --remove-orphans 2>/dev/null || true

echo -e "${YELLOW}Step 4: Starting Docker services${NC}"
# Run docker compose
docker compose up -d

# Check if docker-compose was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Docker compose failed to start services.${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 5: Waiting for services to initialize (10 seconds)...${NC}"
sleep 10

# Open browser to view frontend
echo "🌐 Opening browser to view frontend at http://localhost:3000"

# Detect OS and open browser accordingly
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
  "MINGW"*|"MSYS"*|"CYGWIN"*) # Windows
    start "http://localhost:3000"
    ;;
  *)
    echo "❓ Could not automatically open browser. Please open http://localhost:3000 manually."
    ;;
esac

echo "✅ Services are running. You can view the frontend at http://localhost:3000"
echo "💻 Backend API is available at http://localhost:3002"
echo "📡 API service is available at http://localhost:3001"
echo ""
echo "📋 Use 'docker compose logs -f' to view service logs"
echo "🛑 Use 'docker compose down' to stop all services"
