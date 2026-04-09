#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing dependencies...${NC}"

# Remove any existing lock files to prevent conflicts
rm -f yarn.lock

# Install core dependencies
yarn add reflect-metadata rxjs
yarn add react @types/react
yarn add passport@^0.7.0
yarn add --dev @types/passport@^1.0.15 @types/uuid

echo -e "${GREEN}Successfully installed dependencies${NC}"
