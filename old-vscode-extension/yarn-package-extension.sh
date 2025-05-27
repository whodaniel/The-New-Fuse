#!/bin/bash

# Package the VS Code extension using Yarn workspace
echo "======================================================"
echo "     Packaging The New Fuse VS Code Extension         "
echo "            (Yarn Workspace Version)                  "
echo "======================================================"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Get the workspace root (assumes standard structure)
WORKSPACE_ROOT="$(cd ../../.. && pwd)"

echo -e "${YELLOW}Step 1: Checking for required tools...${NC}"
# Check for yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}Error: yarn is not installed. Please install it first.${NC}"
    exit 1
fi

# Check for vsce
if ! command -v vsce &> /dev/null; then
    echo -e "${YELLOW}Installing vsce globally...${NC}"
    yarn global add @vscode/vsce
    
    if ! command -v vsce &> /dev/null; then
        echo -e "${YELLOW}Using npx for vsce...${NC}"
        VSCE_CMD="npx @vscode/vsce"
    else
        VSCE_CMD="vsce"
    fi
else
    VSCE_CMD="vsce"
fi

echo -e "${YELLOW}Step 2: Running build in the workspace context...${NC}"
# Run build using yarn from the workspace root
(cd "$WORKSPACE_ROOT" && yarn workspace the-new-fuse-vscode run build)

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Validating package.json...${NC}"
# Check if publisher field exists
if ! grep -q "\"publisher\":" package.json; then
    echo -e "${YELLOW}Adding publisher field to package.json...${NC}"
    # Create a temporary file with the publisher field
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.publisher) {
        pkg.publisher = 'thefuse';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('Added publisher field');
    }
    "
fi

echo -e "${YELLOW}Step 4: Packaging extension...${NC}"
# Create dist directory if it doesn't exist
mkdir -p ./dist

# Create a temp directory for packaging
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temporary directory for packaging: ${TEMP_DIR}${NC}"

# Copy files to temp directory
echo -e "${YELLOW}Copying extension files to temp directory...${NC}"
cp -r ./dist "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp -r ./resources "$TEMP_DIR/" 2>/dev/null || true
cp -r ./media "$TEMP_DIR/" 2>/dev/null || true
cp README.md "$TEMP_DIR/" 2>/dev/null || true
cp LICENSE "$TEMP_DIR/" 2>/dev/null || true
cp CHANGELOG.md "$TEMP_DIR/" 2>/dev/null || true

# Remove workspace: references from package.json in the temp directory
echo -e "${YELLOW}Removing workspace references from package.json...${NC}"
node -e "
const fs = require('fs');
const path = require('path');
const tempDir = process.argv[1];
const pkgPath = path.join(tempDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Function to process dependencies
const processDeps = (deps) => {
    if (!deps) return {};
    const result = {};
    for (const [name, version] of Object.entries(deps)) {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
            result[name] = '*';
        } else {
            result[name] = version;
        }
    }
    return result;
};

pkg.dependencies = processDeps(pkg.dependencies);
pkg.devDependencies = processDeps(pkg.devDependencies);

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Workspace references removed from package.json');
" "$TEMP_DIR"

# Package the extension in the temp directory
echo -e "${YELLOW}Running vsce package command...${NC}"
(cd "$TEMP_DIR" && $VSCE_CMD package --no-dependencies)

# Check if packaging was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Packaging failed. Check errors above.${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Move the vsix file to our dist folder
echo -e "${YELLOW}Moving VSIX file to dist folder...${NC}"
find "$TEMP_DIR" -name "*.vsix" -exec mv {} ./dist/ \;

# Get the name of the generated VSIX file
VSIX_FILE=$(find ./dist -name "*.vsix" -type f -printf "%f\n" | head -1 2>/dev/null || find ./dist -name "*.vsix" -type f | xargs basename 2>/dev/null)

# Clean up temp directory
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

if [ -n "$VSIX_FILE" ]; then
    echo -e "${GREEN}✅ Extension packaged successfully!${NC}"
    echo -e "${GREEN}📦 VSIX file created at:${NC} ./dist/$VSIX_FILE"
    echo ""
    echo "To install the extension:"
    echo "  - In VS Code, go to the Extensions view (Ctrl+Shift+X)"
    echo "  - Click the '...' menu in the top-right of the Extensions view"
    echo "  - Select 'Install from VSIX...' and choose the file at: ./dist/$VSIX_FILE"
else
    echo -e "${RED}❌ VSIX file not found. Packaging may have failed.${NC}"
    exit 1
fi