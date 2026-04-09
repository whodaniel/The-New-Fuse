#!/bin/bash

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default options
CONFIRM=false
STOP_SERVERS=true
CLEAN_DOCKER=true
RESET_ENV=false
BACKUP=false
BACKUP_DIR="./cleanup-backups/$(date +%Y%m%d_%H%M%S)"

# Print usage information
usage() {
  echo -e "${GREEN}The New Fuse Development Environment Cleanup Script${NC}"
  echo -e "Usage: $0 [options]"
  echo -e "Options:"
  echo -e "  -y, --yes             Skip confirmation prompt"
  echo -e "  -s, --skip-servers    Skip stopping development servers"
  echo -e "  -d, --skip-docker     Skip Docker cleanup"
  echo -e "  -e, --reset-env       Reset environment files from examples"
  echo -e "  -b, --backup          Create backup before cleaning"
  echo -e "  -h, --help            Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -y|--yes)
      CONFIRM=true
      shift
      ;;
    -s|--skip-servers)
      STOP_SERVERS=false
      shift
      ;;
    -d|--skip-docker)
      CLEAN_DOCKER=false
      shift
      ;;
    -e|--reset-env)
      RESET_ENV=true
      shift
      ;;
    -b|--backup)
      BACKUP=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      exit 1
      ;;
  esac
done

# Print a message to indicate the script is running
echo -e "${GREEN}🧹 Cleaning up development environment...${NC}"

# Confirm before proceeding
if [ "$CONFIRM" = false ]; then
  echo -e "${YELLOW}⚠️  WARNING: This will remove build artifacts, dependencies, and Docker resources.${NC}"
  echo -e "${YELLOW}⚠️  Make sure you have committed any important changes.${NC}"
  read -p "Do you want to continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cleanup cancelled.${NC}"
    exit 1
  fi
fi

# Create backup if requested
if [ "$BACKUP" = true ]; then
  echo -e "${GREEN}📦 Creating backup...${NC}"
  mkdir -p "$BACKUP_DIR"

  # Backup important files (not node_modules or build artifacts)
  find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" \
         -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/.cache/*" \
         -not -path "*/coverage/*" -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || true

  echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"
fi

# Stop development servers if requested
if [ "$STOP_SERVERS" = true ]; then
  echo -e "${GREEN}🛑 Stopping development servers...${NC}"

  # Check if stop-all.sh exists and use it
  if [ -f "./scripts/stop-all.sh" ]; then
    echo "Using stop-all.sh script..."
    bash ./scripts/stop-all.sh
  else
    # Otherwise use generic process killing
    echo "Stopping processes on common development ports..."
    for port in 3000 3001 3002 3003 5173; do
      pid=$(lsof -ti :$port 2>/dev/null)
      if [ ! -z "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
      fi
    done

    # Kill common development processes
    echo "Stopping common development processes..."
    pkill -f "node.*dev" 2>/dev/null || true
    pkill -f "webpack.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "turbo" 2>/dev/null || true
  fi
fi

# Remove node_modules directories
echo -e "${GREEN}🗑️  Removing node_modules directories...${NC}"
find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Remove build artifacts
echo -e "${GREEN}🗑️  Removing build artifacts...${NC}"
find . -name "dist" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".turbo" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "out" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Remove cache directories
echo -e "${GREEN}🗑️  Removing cache directories...${NC}"
find . -name ".cache" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".next" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".nuxt" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".vite" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".parcel-cache" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".eslintcache" -type f -delete 2>/dev/null || true

# Remove yarn cache
echo -e "${GREEN}🗑️  Removing yarn cache...${NC}"
rm -rf .yarn/cache .yarn/unplugged .yarn/build-state.yml .yarn/install-state.gz 2>/dev/null || true
yarn cache clean 2>/dev/null || true

# Remove log files
echo -e "${GREEN}🗑️  Removing log files...${NC}"
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true

# Remove coverage directories
echo -e "${GREEN}🗑️  Removing coverage directories...${NC}"
find . -name "coverage" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "__snapshots__" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Remove temporary files
echo -e "${GREEN}🗑️  Removing temporary files...${NC}"
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
find . -type f -name "*.tmp" -delete 2>/dev/null || true
find . -type f -name "*.bak" -delete 2>/dev/null || true

# Clean empty directories
echo -e "${GREEN}🗑️  Cleaning empty directories...${NC}"
find . -type d -empty -not -path "*/\.*" -delete 2>/dev/null || true

# Remove lock files (commented out for safety)
# Lock files should generally not be deleted as they ensure consistent dependencies
# Uncomment the following lines only if you know what you're doing
# echo -e "${GREEN}🗑️  Removing lock files...${NC}"
# find . -name "package-lock.json" -type f -delete 2>/dev/null || true
# find . -name "yarn.lock" -type f -delete 2>/dev/null || true

# Clean Docker data if requested
if [ "$CLEAN_DOCKER" = true ]; then
  echo -e "${GREEN}🐳 Cleaning Docker data...${NC}"

  # Check if Docker is installed and running
  if command -v docker &> /dev/null && docker info &> /dev/null; then
    # Use docker-compose down if available
    if [ -f "docker-compose.yml" ]; then
      echo "Using docker-compose down to clean up..."
      docker-compose down --remove-orphans --volumes 2>/dev/null || true
    fi

    # Also check other docker-compose files
    for compose_file in docker/*.yml; do
      if [ -f "$compose_file" ]; then
        echo "Cleaning up using $compose_file..."
        docker-compose -f "$compose_file" down --remove-orphans --volumes 2>/dev/null || true
      fi
    done

    # Stop all running containers related to the project
    echo "🛑 Stopping running containers..."
    docker ps -a --filter "name=the-new-fuse" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
    docker ps -a --filter "name=fuse" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
    docker ps -a --filter "label=com.the-new-fuse" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true

    # Remove all containers related to the project
    echo "🗑️  Removing containers..."
    docker ps -a --filter "name=the-new-fuse" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true
    docker ps -a --filter "name=fuse" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true
    docker ps -a --filter "label=com.the-new-fuse" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true

    # Remove all volumes related to the project
    echo "🗑️  Removing volumes..."
    docker volume ls --filter "name=the-new-fuse" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    docker volume ls --filter "name=fuse" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    docker volume ls --filter "name=postgres_data" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    docker volume ls --filter "name=redis_data" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    docker volume ls --filter "name=minio_data" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true

    # Remove all networks related to the project
    echo "🗑️  Removing networks..."
    docker network ls --filter "name=the-new-fuse" --format "{{.ID}}" | xargs -r docker network rm 2>/dev/null || true
    docker network ls --filter "name=fuse" --format "{{.ID}}" | xargs -r docker network rm 2>/dev/null || true
    docker network ls --filter "name=fuse-network" --format "{{.ID}}" | xargs -r docker network rm 2>/dev/null || true

    # Remove all images related to the project
    echo "🗑️  Removing images..."
    docker images --filter "reference=*the-new-fuse*" --format "{{.ID}}" | xargs -r docker rmi -f 2>/dev/null || true
    docker images --filter "reference=*fuse*" --format "{{.ID}}" | xargs -r docker rmi -f 2>/dev/null || true

    # Prune unused Docker resources
    echo "🧹 Pruning unused Docker resources..."
    docker system prune -f --volumes 2>/dev/null || true
  else
    echo -e "${YELLOW}⚠️  Docker is not installed or not running. Skipping Docker cleanup.${NC}"
  fi
fi

# Reset environment files if requested
if [ "$RESET_ENV" = true ]; then
  echo -e "${GREEN}⚙️  Resetting environment files...${NC}"

  # Root .env file
  if [ -f ".env.example" ]; then
    echo "Resetting root .env file..."
    cp .env.example .env
  fi

  # App .env files
  for env_example in $(find ./apps -name ".env.example" 2>/dev/null); do
    env_file="${env_example/.env.example/.env}"
    echo "Resetting $env_file..."
    cp "$env_example" "$env_file"
  done

  # Package .env files
  for env_example in $(find ./packages -name ".env.example" 2>/dev/null); do
    env_file="${env_example/.env.example/.env}"
    echo "Resetting $env_file..."
    cp "$env_example" "$env_file"
  done
fi

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo -e "${GREEN}To reinstall dependencies, run: yarn install${NC}"

# Print additional instructions
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Run ${GREEN}yarn install${NC} to reinstall dependencies"
echo -e "2. Run ${GREEN}yarn build${NC} to rebuild the project"
if [ "$CLEAN_DOCKER" = true ]; then
  echo -e "3. Run ${GREEN}docker-compose up -d${NC} to start Docker services"
fi
echo -e "4. Run ${GREEN}yarn dev${NC} to start the development servers"
