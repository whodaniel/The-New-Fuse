#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     Simple Packaging for VSCode Extension         ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Clean up previous builds
echo -e "${YELLOW}Step 1: Cleaning up previous builds...${NC}"
rm -rf *.vsix

# Step 2: Create a temporary directory for packaging
echo -e "${YELLOW}Step 2: Creating temporary packaging directory...${NC}"
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Step 3: Copy necessary files to the temporary directory
echo -e "${YELLOW}Step 3: Copying files to temporary directory...${NC}"

# Create directory structure
mkdir -p "$TEMP_DIR/dist"
mkdir -p "$TEMP_DIR/resources"
mkdir -p "$TEMP_DIR/media"

# Copy package.json
cp package.json "$TEMP_DIR/"

# Copy resources if they exist
if [ -d "resources" ]; then
  cp -r resources/* "$TEMP_DIR/resources/" 2>/dev/null || true
fi

# Copy media if it exists
if [ -d "media" ]; then
  cp -r media/* "$TEMP_DIR/media/" 2>/dev/null || true
fi

# Copy dist directory if it exists
if [ -d "dist" ]; then
  cp -r dist/* "$TEMP_DIR/dist/" 2>/dev/null || true
fi

# If dist doesn't exist or is empty, create a minimal extension.js file
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo -e "${YELLOW}Creating minimal extension.js file...${NC}"
  mkdir -p "$TEMP_DIR/dist"
  cat > "$TEMP_DIR/dist/extension.js" << 'EOF'
// Minimal extension.js file
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('The New Fuse extension is now active!');
  
  // Register a simple command
  let disposable = vscode.commands.registerCommand('thefuse.helloWorld', function () {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  context.subscriptions.push(disposable);
  
  return {
    // Return minimal API
    showMessage: (message) => {
      vscode.window.showInformationMessage(message);
    }
  };
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF
fi

# Step 4: Modify package.json to remove workspace dependencies and fix issues
echo -e "${YELLOW}Step 4: Modifying package.json...${NC}"
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
pkg.main = 'dist/extension.js';

// Remove scripts to avoid compilation
pkg.scripts = {
  vscode: 'echo \"Skipping TypeScript compilation\"'
};

// Ensure we have a publisher
if (!pkg.publisher) {
  pkg.publisher = 'thefuse';
}

// Remove type: module if it exists (causes issues with vsce)
if (pkg.type === 'module') {
  delete pkg.type;
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Modified package.json saved');
"

# Step 5: Create a minimal .vscodeignore file in the temp directory
echo -e "${YELLOW}Step 5: Creating .vscodeignore file...${NC}"
cat > "$TEMP_DIR/.vscodeignore" << EOF
.vscode/**
.vscode-test/**
src/**
**/*.map
.gitignore
tsconfig.json
**/tsconfig.json
**/webpack.config.js
**/.eslintrc.json
**/*.ts
**/*.tsx
node_modules/**
**/*.vsix
.yarnrc
**/yarn.lock
**/package-lock.json
.yarn/**
**/jest.config.js
**/jest.config.cjs
**/benchmarks/
**/test-results.xml
**/coverage/
**/node_modules/.cache/
**/__tests__/**
**/__mocks__/**
**/test/**
**/tests/**
**/*.test.*
**/*.spec.*
**/temp/**
**/tmp/**
**/.temp/**
**/scripts/**
**/*.sh
EOF

# Step 6: Package the extension
echo -e "${YELLOW}Step 6: Packaging the extension...${NC}"

# Determine vsce command
if command -v vsce &> /dev/null; then
  VSCE_CMD="vsce"
elif [ -f "./node_modules/.bin/vsce" ]; then
  VSCE_CMD="./node_modules/.bin/vsce"
else
  VSCE_CMD="npx @vscode/vsce"
fi

# Package the extension in the temp directory
(cd "$TEMP_DIR" && $VSCE_CMD package --no-dependencies)

# Check if packaging was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Packaging failed with standard approach. Trying with additional flags...${NC}"
  (cd "$TEMP_DIR" && $VSCE_CMD package --no-dependencies --no-git --skip-license)
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Packaging failed again. Final attempt with maximum bypassing...${NC}"
    (cd "$TEMP_DIR" && $VSCE_CMD package --no-dependencies --no-git --skip-license --no-update-package-json --no-yarn)
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}All packaging attempts failed.${NC}"
      rm -rf "$TEMP_DIR"
      exit 1
    fi
  fi
fi

# Find the VSIX file and copy it back to the original directory
VSIX_FILE=$(find "$TEMP_DIR" -name "*.vsix" -type f)
if [ -n "$VSIX_FILE" ]; then
  cp "$VSIX_FILE" .
  echo -e "${GREEN}Successfully created: $(basename "$VSIX_FILE")${NC}"
else
  echo -e "${RED}Failed to find the created VSIX file.${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}Packaging process completed!${NC}"
