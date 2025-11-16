#!/bin/bash

# Colors for better feedback
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting VS Code Extension Settings Test${NC}"
echo "=========================================="

# Test scenarios
echo -e "${GREEN}1. Testing LLM Provider Configuration${NC}"
echo "Setting LLM Provider to 'vscode'..."
code --install-extension ./.vsix-artifacts/the-new-fuse-latest.vsix --force
code --execute-command "workbench.action.openSettings" "theNewFuse.llmProvider"
echo -e "${YELLOW}Please manually set the provider to 'vscode' in settings and verify it saves correctly${NC}"
echo ""

echo -e "${GREEN}2. Testing Cerebras Provider Configuration${NC}"
echo "Attempting to set Cerebras API Key and Model..."
code --execute-command "workbench.action.openSettings" "theNewFuse.cerebras"
echo -e "${YELLOW}Please manually configure Cerebras settings and verify they save correctly${NC}"
echo ""

echo -e "${GREEN}3. Testing Ollama Provider Configuration${NC}"
echo "Attempting to set Ollama URL and Model..."
code --execute-command "workbench.action.openSettings" "theNewFuse.ollama"
echo -e "${YELLOW}Please manually configure Ollama settings and verify they save correctly${NC}"
echo ""

echo -e "${GREEN}4. Testing VS Code Integration${NC}"
echo "The VS Code LM API should work without API keys..."
code --execute-command "the-new-fuse.selectLLMProvider"
echo -e "${YELLOW}Please select 'vscode' provider and verify it works without API keys${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo "Please record any issues you encountered."
