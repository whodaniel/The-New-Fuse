#!/bin/bash

# Direct package script for VS Code extension
echo "======================================================"
echo "     Packaging The New Fuse VS Code Extension         "
echo "            (Direct Build Method)                     "
echo "======================================================"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Checking build script exists...${NC}"
if [ ! -f "./build.sh" ]; then
    echo -e "${RED}Error: build.sh not found. Cannot build extension.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Running direct build...${NC}"
# Make build script executable if it isn't already
chmod +x ./build.sh

# Run build directly
./build.sh

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Creating temporary packaging directory...${NC}"
# Create a temp directory for packaging
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temporary directory for packaging: ${TEMP_DIR}${NC}"

# Copy necessary files to temp directory
echo -e "${YELLOW}Copying extension files to temp directory...${NC}"
mkdir -p "$TEMP_DIR/dist"
cp -r ./dist/* "$TEMP_DIR/dist/" 2>/dev/null || true
cp package.json "$TEMP_DIR/"
cp -r ./resources "$TEMP_DIR/" 2>/dev/null || true
cp -r ./media "$TEMP_DIR/" 2>/dev/null || true
cp README.md "$TEMP_DIR/" 2>/dev/null || true
cp LICENSE "$TEMP_DIR/" 2>/dev/null || true
cp CHANGELOG.md "$TEMP_DIR/" 2>/dev/null || true

# Check if publisher field exists
if ! grep -q "\"publisher\":" "$TEMP_DIR/package.json"; then
    echo -e "${YELLOW}Adding publisher field to package.json...${NC}"
    # Create a temporary file with the publisher field
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$TEMP_DIR/package.json', 'utf8'));
    if (!pkg.publisher) {
        pkg.publisher = 'thefuse';
        fs.writeFileSync('$TEMP_DIR/package.json', JSON.stringify(pkg, null, 2));
        console.log('Added publisher field');
    }
    "
fi

echo -e "${YELLOW}Step 4: Installing vsce if needed...${NC}"
# Check for vsce in node_modules
if [ ! -f "./node_modules/.bin/vsce" ]; then
    echo -e "${YELLOW}Installing vsce locally...${NC}"
    npm install --no-save @vscode/vsce
fi

VSCE_CMD="./node_modules/.bin/vsce"
if [ ! -f "$VSCE_CMD" ]; then
    VSCE_CMD="npx @vscode/vsce"
fi

echo -e "${YELLOW}Step 5: Packaging the extension...${NC}"
# Create output directory
mkdir -p ./dist

# Package the extension in the temp directory
(cd "$TEMP_DIR" && $VSCE_CMD package --out "../dist/the-new-fuse-vscode.vsix")

# Check if packaging was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Packaging failed. See errors above.${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Clean up temp directory
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

# Check if the VSIX file was created
if [ -f "./dist/the-new-fuse-vscode.vsix" ]; then
    echo -e "${GREEN}✅ Extension packaged successfully!${NC}"
    echo -e "${GREEN}📦 VSIX file created at:${NC} ./dist/the-new-fuse-vscode.vsix"
    echo ""
    echo "To install the extension:"
    echo "  - In VS Code, go to the Extensions view (Ctrl+Shift+X)"
    echo "  - Click the '...' menu in the top-right of the Extensions view"
    echo "  - Select 'Install from VSIX...' and choose the file at: ./dist/the-new-fuse-vscode.vsix"
else
    echo -e "${RED}❌ VSIX file not created. Packaging failed.${NC}"
    exit 1
fi