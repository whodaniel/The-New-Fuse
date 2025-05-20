#!/bin/bash
# Script to check the status of all Docker services

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}The New Fuse - Service Status Check${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker daemon is not running. Please start Docker first.${NC}"
  exit 1
fi

# Check Docker service status
echo -e "\n${YELLOW}Docker Container Status:${NC}"
docker compose ps

# Define the services to check
services=("frontend:3000" "backend:3002" "api:3001" "redis:6379" "postgres:5432")

echo -e "\n${YELLOW}Service Health Checks:${NC}"

# For each service, check if it's responding
for service in "${services[@]}"; do
  # Split service and port
  IFS=':' read -r name port <<< "$service"
  
  echo -e "${BLUE}Checking $name (port $port)...${NC}"
  
  if [[ "$name" == "redis" ]]; then
    # For Redis, check using docker exec if possible
    if docker compose exec redis redis-cli ping > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Redis is running and responding${NC}"
    else
      echo -e "${RED}❌ Redis is not responding${NC}"
    fi
  elif [[ "$name" == "postgres" ]]; then
    # For Postgres, check using docker exec if possible
    if docker compose exec postgres pg_isready > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Postgres is running and responding${NC}"
    else
      echo -e "${RED}❌ Postgres is not responding${NC}"
    fi
  else
    # For HTTP services, use curl with a timeout
    if command -v curl > /dev/null; then
      if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port -m 2 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running and responding on port $port${NC}"
      else
        echo -e "${RED}❌ $name is not responding on port $port${NC}"
      fi
    else
      echo -e "${YELLOW}⚠️  Cannot check $name: curl command not found${NC}"
    fi
  fi
done

echo -e "\n${YELLOW}Container Logs Summary:${NC}"
docker compose logs --tail=5

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Status check completed${NC}"
echo -e "${BLUE}For detailed logs of a specific service, run:${NC}"
echo -e "${YELLOW}docker compose logs [service_name]${NC}"
echo -e "${BLUE}========================================${NC}"
