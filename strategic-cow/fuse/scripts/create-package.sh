#!/bin/bash
# create-package.sh - Script to create a new package with standard structure

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Show usage
show_usage() {
  echo -e "${CYAN}Usage:${NC} ./create-package.sh <package-name> [package-description]"
  echo -e "${YELLOW}Example:${NC} ./create-package.sh api-client \"API Client for The New Fuse\""
  exit 1
}

# Check if package name is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No package name provided${NC}"
  show_usage
fi

PACKAGE_NAME=$1
PACKAGE_DESCRIPTION=${2:-"A package for The New Fuse"}
PACKAGE_DIR="packages/$PACKAGE_NAME"

# Check if package already exists
if [ -d "$PACKAGE_DIR" ]; then
  echo -e "${RED}Error: Package '$PACKAGE_NAME' already exists at $PACKAGE_DIR${NC}"
  exit 1
fi

echo -e "${CYAN}Creating new package: ${GREEN}@the-new-fuse/$PACKAGE_NAME${NC}"
echo -e "${BLUE}Description: ${NC}$PACKAGE_DESCRIPTION"
echo ""

# Create package directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p "$PACKAGE_DIR"/{src,tests,docs}

# Copy template files
echo -e "${YELLOW}Copying template files...${NC}"
cp -r templates/package-template/* "$PACKAGE_DIR/"

# Update package.json
echo -e "${YELLOW}Updating package configuration...${NC}"
sed -i '' "s/@the-new-fuse\/package-name/@the-new-fuse\/$PACKAGE_NAME/g" "$PACKAGE_DIR/package.json"
sed -i '' "s/Package description/$PACKAGE_DESCRIPTION/g" "$PACKAGE_DIR/package.json"

# Update README.md
sed -i '' "s/@the-new-fuse\/package-name/@the-new-fuse\/$PACKAGE_NAME/g" "$PACKAGE_DIR/README.md"
sed -i '' "s/Brief description of what this package does and its purpose within The New Fuse ecosystem./$PACKAGE_DESCRIPTION/g" "$PACKAGE_DIR/README.md"

# Update index.ts
sed -i '' "s/@the-new-fuse\/package-name/@the-new-fuse\/$PACKAGE_NAME/g" "$PACKAGE_DIR/src/index.ts"
sed -i '' "s/Package description/$PACKAGE_DESCRIPTION/g" "$PACKAGE_DIR/src/index.ts"

echo -e "${GREEN}Package created successfully at $PACKAGE_DIR${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Update ${BLUE}package.json${NC} with appropriate dependencies"
echo -e "  2. Implement your package functionality in the ${BLUE}src/${NC} directory"
echo -e "  3. Write tests in the ${BLUE}tests/${NC} directory"
echo -e "  4. Update the ${BLUE}README.md${NC} with proper documentation"
echo ""
echo -e "${YELLOW}To build your new package:${NC}"
echo -e "  yarn workspace @the-new-fuse/$PACKAGE_NAME build"
echo ""