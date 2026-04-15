#!/bin/bash
# Setup script for The New Fuse project
# Ensures consistent Bun usage and proper dependency installation

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}                The New Fuse - Project Setup                         ${NC}"
echo -e "${BLUE}=====================================================================${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${YELLOW}Node.js version:${NC} $NODE_VERSION"

if [[ $NODE_VERSION < "v18" ]]; then
  echo -e "${RED}❌ Node.js version 18+ required. Please upgrade Node.js.${NC}"
  exit 1
fi

# Check if Bun is available, install if needed
if ! command -v bun &>/dev/null; then
  echo -e "${YELLOW}Installing Bun...${NC}"
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Verify Bun installation
BUN_VERSION=$(bun --version)
echo -e "${GREEN}✅ Bun version: $BUN_VERSION${NC}"

# Clean old yarn artifacts
echo -e "${YELLOW}Cleaning old yarn artifacts...${NC}"
rm -rf .yarn
rm -f .yarnrc.yml yarn.lock

# Install dependencies
echo -e "${YELLOW}Installing dependencies with Bun...${NC}"
pnpm install

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Project setup completed successfully!${NC}"
  echo -e "${GREEN}✅ Using Bun version: $BUN_VERSION${NC}"
  echo -e "${YELLOW}You can now run:${NC}"
  echo -e "  ${YELLOW}pnpm run dev${NC}     - Start development server"
  echo -e "  ${YELLOW}pnpm run build${NC}   - Build the project"
  echo -e "  ${YELLOW}pnpm run test${NC}    - Run tests"
else
  echo -e "${RED}❌ Project setup failed. Please check the errors above.${NC}"
  exit 1
fi
