#!/bin/bash

# Set color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
STRICT_MODE=true
DEBUG_MODE=false
WATCH_MODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --relaxed) STRICT_MODE=false ;;
        --debug) DEBUG_MODE=true ;;
        --watch) WATCH_MODE=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${GREEN}Starting build process...${NC}"

# Check environment
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo -e "${RED}Yarn is required but not installed.${NC}" >&2; exit 1; }

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install || { echo -e "${RED}Failed to install dependencies${NC}" >&2; exit 1; }
fi

# TypeScript configuration
TS_CONFIG="--project tsconfig.json"
if [ "$STRICT_MODE" = false ]; then
    echo -e "${YELLOW}Running in relaxed mode - some type checks will be skipped${NC}"
    TS_CONFIG="$TS_CONFIG --skipLibCheck"
fi

# Build command construction
BUILD_CMD="yarn tsc $TS_CONFIG"
if [ "$DEBUG_MODE" = true ]; then
    BUILD_CMD="$BUILD_CMD --sourceMap"
    echo -e "${YELLOW}Debug mode enabled - generating source maps${NC}"
fi

if [ "$WATCH_MODE" = true ]; then
    BUILD_CMD="$BUILD_CMD --watch"
    echo -e "${YELLOW}Watch mode enabled - watching for changes${NC}"
fi

# Run build
echo -e "${GREEN}Running build...${NC}"
eval $BUILD_CMD

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Build completed successfully!${NC}"
    
    # Run tests if in strict mode
    if [ "$STRICT_MODE" = true ]; then
        echo -e "${GREEN}Running tests...${NC}"
        yarn test || { echo -e "${RED}Tests failed${NC}" >&2; exit 1; }
    fi
    
    # Start in debug mode if specified
    if [ "$DEBUG_MODE" = true ]; then
        echo -e "${GREEN}Starting in debug mode...${NC}"
        yarn start:debug
    elif [ "$WATCH_MODE" = false ]; then
        echo -e "${GREEN}Starting application...${NC}"
        yarn start
    fi
else
    echo -e "${RED}Build failed with exit code $BUILD_EXIT_CODE${NC}"
    exit $BUILD_EXIT_CODE
fi
