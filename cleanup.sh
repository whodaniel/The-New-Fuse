#!/bin/bash

# Set color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default configuration
CLEAN_DEV=false
CLEAN_DEPS=true
CLEAN_BUILD=true
CLEAN_DOCKER=true
CLEAN_CACHE=true
FORCE=false
DIRECT_MODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) CLEAN_DEV=true ;;
        --deps) CLEAN_DEPS=true; CLEAN_BUILD=false; CLEAN_DOCKER=false; CLEAN_CACHE=false ;;
        --build) CLEAN_BUILD=true; CLEAN_DEPS=false; CLEAN_DOCKER=false; CLEAN_CACHE=false ;;
        --docker) CLEAN_DOCKER=true; CLEAN_DEPS=false; CLEAN_BUILD=false; CLEAN_CACHE=false ;;
        --cache) CLEAN_CACHE=true; CLEAN_DEPS=false; CLEAN_BUILD=false; CLEAN_DOCKER=false ;;
        --no-docker) CLEAN_DOCKER=false ;;
        --force) FORCE=true ;;
        --direct) DIRECT_MODE=true ;; # Allow direct execution without yarn
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${GREEN}Starting enhanced cleanup process...${NC}"

# When executing through yarn, check if we have a lockfile issue
# If we do, execute the script directly in direct mode
if [ "$DIRECT_MODE" = false ] && [ -f "package.json" ]; then
    # Check for yarn error from lockfile
    if yarn check 2>&1 | grep -q "This package doesn't seem to be present in your lockfile"; then
        echo -e "${YELLOW}Detected lockfile issues. Switching to direct execution mode...${NC}"
        # Re-execute this script directly with all the same arguments plus --direct
        exec bash "$0" "$@" --direct
        # The exec will replace the current process, so we won't reach here
        exit 0
    fi
fi

# Development environment cleanup
if [ "$CLEAN_DEV" = true ]; then
    echo -e "\n${GREEN}Cleaning development environment...${NC}"
    
    # Stop development servers
    echo "Stopping development servers..."
    pkill -f "node.*dev" || true
    pkill -f "webpack.*dev" || true
    pkill -f "vite" || true
    
    # Clean development caches
    echo "Cleaning development caches..."
    rm -rf .parcel-cache
    rm -rf .cache
    rm -rf .next
    rm -rf .nuxt
    find . -name ".eslintcache" -type f -delete
    
    # Clean test artifacts
    echo "Cleaning test artifacts..."
    rm -rf coverage
    find . -name "__snapshots__" -type d -prune -exec rm -rf '{}' +
fi

# Clean dependencies (node_modules, yarn cache)
if [ "$CLEAN_DEPS" = true ]; then
    echo -e "\n${GREEN}Cleaning dependencies...${NC}"
    # Yarn/npm
    if [ "$DIRECT_MODE" = true ] || ! command -v yarn &> /dev/null; then
        echo "Skipping yarn cache clean (direct mode or yarn not available)"
    else
        yarn cache clean || true
    fi
    rm -rf .yarn/cache
    rm -rf .yarn/build-state.yml
    rm -rf .yarn/install-state.gz
    find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
fi

# Clean build artifacts
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "\n${GREEN}Cleaning TypeScript and build artifacts...${NC}"
    find . -name ".tsbuildinfo" -type f -delete
    find . -name "tsconfig.tsbuildinfo" -type f -delete
    find . -name "*.map" -type f -delete
    find . -name "dist" -type d -prune -exec rm -rf '{}' +
    find . -name "build" -type d -prune -exec rm -rf '{}' +
    find . -name ".next" -type d -prune -exec rm -rf '{}' +
fi

# Clean Docker artifacts
if [ "$CLEAN_DOCKER" = true ]; then
    echo -e "\n${GREEN}Cleaning Docker artifacts...${NC}"
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
        
        # Remove duplicate Dockerfiles from root
        echo "Removing duplicate Dockerfiles..."
        rm -f Dockerfile Dockerfile.api Dockerfile.client Dockerfile.functions 2>/dev/null || true
    else
        echo -e "${RED}Docker is not installed${NC}"
    fi
fi

# Clean cache files
if [ "$CLEAN_CACHE" = true ]; then
    echo -e "\n${GREEN}Cleaning cache files...${NC}"
    # Clean temporary and backup files
    find . -type f -name "*.tmp" -delete
    find . -type f -name "*.bak" -delete
    find . -type f -name "*copy*" -delete
    find . -type f -name "*.log" -mtime +7 -delete
    find . -type f -name "*.pid" -delete
    find . -type f -name "*.lock" ! -name "yarn.lock" -delete
    find . -type f -name ".DS_Store" -delete
    find . -type f -name "Thumbs.db" -delete
    
    # Clean empty directories
    echo -e "\n${GREEN}Cleaning empty directories...${NC}"
    find . -type d -empty -delete
    
    # Clean old analysis and report files
    echo -e "\n${GREEN}Cleaning old analysis files...${NC}"
    find . -type f -name "*analysis_report*.md" ! -name "analysis_report_v2.md" -delete
    find . -type f -name "*analysis_results*.json" ! -newermt "30 days ago" -delete
    find . -type f -name "component-analysis-*.txt" ! -newermt "30 days ago" -delete
    find . -type f -name "component-analysis-*.json" ! -newermt "30 days ago" -delete
fi

echo -e "\n${GREEN}Cleanup complete!${NC}"

if [ "$CLEAN_DEV" = true ]; then
    echo -e "${YELLOW}Development environment cleaned. Run 'yarn install' and 'yarn dev' to restart development servers${NC}"
elif [ "$CLEAN_DEPS" = true ]; then
    echo -e "${YELLOW}Run 'yarn install' to reinstall dependencies${NC}"
fi

# If we deleted the lockfile or have lockfile issues, suggest running yarn install
if [ ! -f "yarn.lock" ] || [ "$DIRECT_MODE" = true ]; then
    echo -e "${YELLOW}Yarn lockfile issues detected. Run 'yarn install' to regenerate the lockfile${NC}"
fi