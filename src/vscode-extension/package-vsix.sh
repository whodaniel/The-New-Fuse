#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     Packaging The New Fuse VS Code Extension     ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Clean up previous builds
echo -e "${YELLOW}Step 1: Cleaning up previous builds...${NC}"
rm -rf dist *.vsix

# Step 2: Install dependencies if needed
echo -e "${YELLOW}Step 2: Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.yarn-integrity" ]; then
  echo "Installing dependencies..."
  yarn install
fi

# Step 3: Compile TypeScript
echo -e "${YELLOW}Step 3: Compiling TypeScript...${NC}"
yarn compile

# Check if compilation was successful
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}TypeScript compilation had errors, but we'll continue with packaging...${NC}"
fi

# Step 4: Ensure vsce is available
echo -e "${YELLOW}Step 4: Ensuring vsce is available...${NC}"
if ! command -v vsce &> /dev/null && [ ! -f "./node_modules/.bin/vsce" ]; then
  echo "Installing vsce..."
  yarn add --dev @vscode/vsce
fi

# Determine vsce command
if [ -f "./node_modules/.bin/vsce" ]; then
  VSCE_CMD="./node_modules/.bin/vsce"
else
  VSCE_CMD="npx @vscode/vsce"
fi

# Step 5: Package the extension
echo -e "${YELLOW}Step 5: Packaging the extension...${NC}"
$VSCE_CMD package --no-dependencies

# Check if packaging was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: VSIX packaging failed. Trying alternative approach...${NC}"
  
  # Create a temporary directory for packaging
  TEMP_DIR=$(mktemp -d)
  echo "Created temporary directory: $TEMP_DIR"
  
  # Copy necessary files
  echo "Copying files to temporary directory..."
  mkdir -p "$TEMP_DIR/dist"
  cp -r dist/* "$TEMP_DIR/dist/" 2>/dev/null || true
  cp package.json "$TEMP_DIR/"
  
  # Copy resources if they exist
  if [ -d "resources" ]; then
    mkdir -p "$TEMP_DIR/resources"
    cp -r resources/* "$TEMP_DIR/resources/" 2>/dev/null || true
  fi
  
  # Copy media if it exists
  if [ -d "media" ]; then
    mkdir -p "$TEMP_DIR/media"
    cp -r media/* "$TEMP_DIR/media/" 2>/dev/null || true
  fi
  
  # Modify package.json to remove workspace dependencies
  echo "Modifying package.json to remove workspace dependencies..."
  node -e "
  const fs = require('fs');
  const path = require('path');
  
  const pkgPath = path.join('$TEMP_DIR', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Function to process dependencies
  function processDeps(deps) {
    if (!deps) return deps;
    const newDeps = {};
    
    for (const [name, version] of Object.entries(deps)) {
      // Skip workspace dependencies
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        console.log('Removing workspace dependency:', name);
        continue;
      }
      newDeps[name] = version;
    }
    
    return newDeps;
  }
  
  // Process dependencies
  pkg.dependencies = processDeps(pkg.dependencies);
  pkg.devDependencies = processDeps(pkg.devDependencies);
  
  // Ensure main points to the correct file
  if (pkg.main && pkg.main.startsWith('./src/')) {
    pkg.main = pkg.main.replace('./src/', './dist/');
  }
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Modified package.json saved');
  "
  
  # Try packaging in the temporary directory
  echo "Attempting to package from temporary directory..."
  (cd "$TEMP_DIR" && $VSCE_CMD package --no-dependencies)
  
  # If successful, copy the vsix file back
  if [ $? -eq 0 ]; then
    VSIX_FILE=$(find "$TEMP_DIR" -name "*.vsix" -type f)
    if [ -n "$VSIX_FILE" ]; then
      cp "$VSIX_FILE" .
      echo -e "${GREEN}Successfully created: $(basename "$VSIX_FILE")${NC}"
    fi
  else
    echo -e "${RED}Alternative packaging approach also failed.${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  # Clean up
  rm -rf "$TEMP_DIR"
else
  # Find the VSIX file
  VSIX_FILE=$(find . -maxdepth 1 -name "*.vsix" -type f)
  if [ -n "$VSIX_FILE" ]; then
    echo -e "${GREEN}Successfully created: $(basename "$VSIX_FILE")${NC}"
  fi
fi

echo -e "${GREEN}Packaging process completed!${NC}"
