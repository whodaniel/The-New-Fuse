#!/bin/bash

# Fix permissions for The New Fuse scripts and executables
echo "Fixing permissions for The New Fuse scripts..."

# Make all shell scripts executable
find ./scripts -name "*.sh" -exec chmod +x {} \;
echo "✓ Made shell scripts in ./scripts executable"

# Make specific utility scripts executable
if [ -f "./fix-feature-components.sh" ]; then
  chmod +x ./fix-feature-components.sh
  echo "✓ Made fix-feature-components.sh executable"
fi

if [ -f "./fix-layout-components.sh" ]; then
  chmod +x ./fix-layout-components.sh
  echo "✓ Made fix-layout-components.sh executable"
fi

if [ -f "./fix-typescript-syntax.sh" ]; then
  chmod +x ./fix-typescript-syntax.sh
  echo "✓ Made fix-typescript-syntax.sh executable"
fi

if [ -f "./fix-logger-errors.sh" ]; then
  chmod +x ./fix-logger-errors.sh
  echo "✓ Made fix-logger-errors.sh executable"
fi

# Make MCP-related scripts executable
if [ -f "./src/mcp/scripts/start-mcp.sh" ]; then
  chmod +x ./src/mcp/scripts/start-mcp.sh
  echo "✓ Made start-mcp.sh executable"
fi

if [ -f "./src/mcp/scripts/stop-mcp.sh" ]; then
  chmod +x ./src/mcp/scripts/stop-mcp.sh
  echo "✓ Made stop-mcp.sh executable"
fi

# Fix permissions for VS Code extension scripts
if [ -d "./packages/vscode-extension/scripts" ]; then
  find ./packages/vscode-extension/scripts -name "*.sh" -exec chmod +x {} \;
  echo "✓ Made VS Code extension scripts executable"
fi

echo "All permissions fixed successfully!"