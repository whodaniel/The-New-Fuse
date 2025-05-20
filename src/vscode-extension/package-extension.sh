#!/bin/bash

# Package the VS Code extension into a .vsix file
echo "======================================================"
echo "     Packaging The New Fuse VS Code Extension         "
echo "======================================================"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
# Check if vsce is installed globally
if ! command -v vsce &> /dev/null; then
    echo "Installing vsce tool globally..."
    npm install -g @vscode/vsce
    
    # Check if installation succeeded
    if ! command -v vsce &> /dev/null; then
        echo -e "${RED}Failed to install vsce globally. Trying to use local vsce...${NC}"
        
        # Ensure vsce is installed locally
        if ! npm list | grep -q "vsce"; then
            echo "Installing vsce locally..."
            npm install --save-dev @vscode/vsce
        fi
        
        # Set to use local vsce
        VSCE_CMD="npx vsce"
    else
        VSCE_CMD="vsce"
    fi
else
    VSCE_CMD="vsce"
fi

echo -e "${YELLOW}Step 2: Running build script...${NC}"
# Run the build script first
./build.sh

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Validating package.json...${NC}"
# Check for required fields in package.json
if ! grep -q "\"publisher\":" package.json; then
    echo -e "${RED}Error: Missing 'publisher' field in package.json${NC}"
    echo "Please add a publisher field to package.json before packaging."
    exit 1
fi

echo -e "${YELLOW}Step 4: Packaging extension...${NC}"
# Create output directory if it doesn't exist
mkdir -p ./dist

# Determine package name
PACKAGE_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
PUBLISHER=$(node -p "require('./package.json').publisher")
VSIX_NAME="${PUBLISHER}.${PACKAGE_NAME}-${VERSION}.vsix"
VSIX_PATH="./dist/${VSIX_NAME}"

# Package the extension
echo "Running: $VSCE_CMD package --out $VSIX_PATH"
$VSCE_CMD package --out "$VSIX_PATH"

# Check if packaging was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Extension packaged successfully!${NC}"
    echo -e "${GREEN}📦 VSIX file created at:${NC} $VSIX_PATH"
    echo ""
    echo "To install the extension:"
    echo "  - In VS Code, go to the Extensions view (Ctrl+Shift+X)"
    echo "  - Click the '...' menu in the top-right of the Extensions view"
    echo "  - Select 'Install from VSIX...' and choose the file at: $VSIX_PATH"
    echo ""
    echo "For distribution:"
    echo "  - Upload to the VS Code Marketplace, or"
    echo "  - Share the .vsix file directly with users"
else
    echo -e "${RED}❌ Packaging failed. See errors above.${NC}"
    exit 1
fi