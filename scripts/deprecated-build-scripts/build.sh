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
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}pnpm is required but not installed.${NC}" >&2; exit 1; }

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install || { echo -e "${RED}Failed to install dependencies${NC}" >&2; exit 1; }
fi

# Build command construction
BUILD_CMD="pnpm turbo run build"
if [ "$STRICT_MODE" = false ]; then
    echo -e "${YELLOW}Running in relaxed mode - some type checks will be skipped (not directly supported by turbo build but noted)${NC}"
    # Note: Turborepo's 'build' command doesn't directly expose --skipLibCheck in this way
    # The root 'build' script filters already for optimal performance.
fi

if [ "$DEBUG_MODE" = true ]; then
    # Turborepo handles source maps internally if configured in package.json build scripts
    echo -e "${YELLOW}Debug mode enabled (may require specific package config for sourcemaps)${NC}"
fi

if [ "$WATCH_MODE" = true ]; then
    BUILD_CMD="pnpm turbo run dev --continue"
    echo -e "${YELLOW}Watch mode enabled - running turbo dev in parallel${NC}"
else
    echo -e "${GREEN}Running turbo build...${NC}"
    $BUILD_CMD || { echo -e "${RED}Turbo build failed${NC}" >&2; exit 1; }
fi

BUILD_EXIT_CODE=0
if [ "$WATCH_MODE" = false ] && [ $? -ne 0 ]; then
    BUILD_EXIT_CODE=$?
fi

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Build completed successfully!${NC}"
    
    # Run tests if in strict mode
    if [ "$STRICT_MODE" = true ] && [ "$WATCH_MODE" = false ]; then
        echo -e "${GREEN}Running tests...${NC}"
        pnpm turbo run test || { echo -e "${RED}Tests failed${NC}" >&2; exit 1; }
    fi
    
    # Start in debug mode if specified (only if not in watch mode)
    if [ "$DEBUG_MODE" = true ] && [ "$WATCH_MODE" = false ]; then
        echo -e "${GREEN}Starting in debug mode...${NC}"
        # Assuming 'start:debug' is a turbo-compatible script or direct command
        pnpm turbo run start:debug || pnpm run start:debug # Fallback to direct pnpm if not in turbo pipeline
    elif [ "$WATCH_MODE" = false ]; then
        echo -e "${GREEN}Starting application...${NC}"
        pnpm turbo run start || pnpm run start # Fallback to direct pnpm if not in turbo pipeline
    fi
else
    echo -e "${RED}Build failed with exit code $BUILD_EXIT_CODE${NC}"
    exit $BUILD_EXIT_CODE
fi

