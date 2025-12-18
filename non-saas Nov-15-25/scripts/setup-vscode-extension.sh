#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== The New Fuse VS Code Extension Setup =====${NC}"

# Determine extension directory
EXTENSION_DIR="$(pwd)/vscode-extension"
if [ ! -d "$EXTENSION_DIR" ]; then
    EXTENSION_DIR="$(pwd)/src/vscode-extension"
    if [ ! -d "$EXTENSION_DIR" ]; then
        echo -e "${RED}Could not find the vscode-extension directory!${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Using extension directory:${NC} $EXTENSION_DIR"
cd "$EXTENSION_DIR" || { echo -e "${RED}Failed to change directory!${NC}"; exit 1; }

# Setup the extension - Focus only on what's needed for the VS Code extension
echo -e "${YELLOW}Setting up the VS Code extension...${NC}"

# Fix package.json by ensuring it's valid JSON with no comments
if [ -f "package.json" ]; then
    echo -e "${YELLOW}Verifying package.json is valid...${NC}"
    # Use node to check if the JSON is valid
    node -e "try { JSON.parse(require('fs').readFileSync('package.json')); console.log('Valid JSON'); } catch(e) { console.error('Invalid JSON:', e.message); process.exit(1); }"
    if [ $? -ne 0 ]; then
        echo -e "${RED}package.json contains errors. Please fix them before continuing.${NC}"
        exit 1
    fi
else
    echo -e "${RED}package.json not found!${NC}"
    exit 1
fi

# Create a basic MCP config file if it doesn't exist
echo -e "${YELLOW}Setting up MCP configuration...${NC}"
mkdir -p ./mcp
if [ ! -f "./mcp/mcp_config.json" ]; then
    echo '{
  "version": "1.0",
  "enabled": true,
  "services": {
    "document": {
      "enabled": true,
      "options": {}
    },
    "search": {
      "enabled": true,
      "options": {}
    }
  }
}' > ./mcp/mcp_config.json
    echo -e "${GREEN}Created MCP configuration file.${NC}"
fi

# Create data files for testing
echo -e "${YELLOW}Creating test data files...${NC}"
mkdir -p ./data
echo "This is a test file for MCP integration." > ./data/test.txt
echo "# MCP Test Document\n\nUse this document for testing MCP capabilities." > ./data/test.md
echo '{"test": true, "name": "MCP Test Config"}' > ./data/config.json

# Launch VS Code with the extension
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
