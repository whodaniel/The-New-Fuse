#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== The New Fuse MCP Development Setup =====${NC}"

# Determine extension directory
EXTENSION_DIR="$(pwd)"
if [ -d "./vscode-extension" ]; then
    EXTENSION_DIR="$(pwd)/vscode-extension"
elif [ -d "./src/vscode-extension" ]; then
    EXTENSION_DIR="$(pwd)/src/vscode-extension"
fi

echo -e "${YELLOW}Using extension directory:${NC} $EXTENSION_DIR"

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
cd "$EXTENSION_DIR" || { echo -e "${RED}Extension directory not found!${NC}"; exit 1; }

# Check if package manager is specified in project
HAS_YARN_LOCK=false
if [ -f "yarn.lock" ]; then
    HAS_YARN_LOCK=true
fi

# Check which package manager is available
HAS_YARN=false
if command -v yarn &> /dev/null; then
    HAS_YARN=true
fi

# Install dependencies using the appropriate package manager
if [ "$HAS_YARN_LOCK" = true ] || [ "$HAS_YARN" = true ]; then
    echo -e "${YELLOW}Using yarn to install dependencies...${NC}"
    yarn install
else
    echo -e "${YELLOW}Using npm to install dependencies...${NC}"
    npm install
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Check error messages above.${NC}"
    echo -e "${YELLOW}You may need to run 'npm config fix' or manually set up your npm configuration.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Step 2: Compile TypeScript
echo -e "${YELLOW}Step 2: Compiling TypeScript...${NC}"
if [ "$HAS_YARN_LOCK" = true ] || [ "$HAS_YARN" = true ]; then
    yarn compile || yarn run compile || yarn tsc
else
    npm run compile || npx tsc
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to compile. Check TypeScript errors.${NC}"
    exit 1
fi
echo -e "${GREEN}TypeScript compiled successfully.${NC}"

# Step 3: Fix permissions for MCP scripts
echo -e "${YELLOW}Step 3: Fixing permissions for MCP scripts...${NC}"
if [ -f "./fix-permissions.sh" ]; then
    chmod +x ./fix-permissions.sh
    ./fix-permissions.sh
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Warning: Permission script failed, continuing anyway...${NC}"
    fi
else
    echo -e "${YELLOW}Warning: fix-permissions.sh not found, skipping...${NC}"
    find . -name "*.sh" -exec chmod +x {} \;
fi

# Step 4: Create sample files if needed
echo -e "${YELLOW}Step 4: Creating sample files...${NC}"
if [ -f "./create-sample-files.sh" ]; then
    chmod +x ./create-sample-files.sh
    ./create-sample-files.sh
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Warning: Sample file creation failed, continuing...${NC}"
    fi
else
    echo -e "${YELLOW}Warning: create-sample-files.sh not found, skipping...${NC}"
    
    # Create a minimal data directory structure
    mkdir -p ./data
    echo "This is a sample file for MCP testing." > ./data/example.txt
    echo '{"mcp": "enabled", "version": 1}' > ./data/config.json
    echo "# Sample README\nThis directory contains sample files for MCP." > ./data/README.md
    
    echo -e "${GREEN}Created basic sample files manually.${NC}"
fi

# Step 5: Launch VS Code with the extension
echo -e "${GREEN}Setup complete! Now launching VS Code with the extension...${NC}"
echo -e "${YELLOW}===========================================${NC}"
echo -e "${YELLOW}After VS Code opens:${NC}"
echo -e "1. Open Command Palette (Cmd+Shift+P or Ctrl+Shift+P)"
echo -e "2. Type \"Developer: Show Running Extensions\""
echo -e "3. Verify \"The New Fuse\" is listed and enabled"
echo -e "4. Then use Command Palette to run \"thefuse.mcp.initialize\""
echo -e "${YELLOW}===========================================${NC}"

# Determine VS Code path
CODE_CMD="code"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if VS Code is in the standard macOS location
    if [ -d "/Applications/Visual Studio Code.app" ]; then
        CODE_CMD="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    fi
fi

# Launch VS Code
"$CODE_CMD" --new-window --extensionDevelopmentPath="$EXTENSION_DIR"

echo -e "${GREEN}Done! VS Code should be launching now.${NC}"