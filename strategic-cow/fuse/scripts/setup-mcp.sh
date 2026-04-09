#!/bin/bash

# Setup MCP tools for The New Fuse
echo "Setting up MCP tools..."

# Make sure the initialization script is executable
chmod +x ./scripts/initialize-mcp.sh

# Run the initialization script if it hasn't been run yet
if [ ! -d "./mcp/logs" ]; then
  echo "Running MCP initialization first..."
  ./scripts/initialize-mcp.sh
fi

# Start the MCP server
echo "Starting MCP server..."

# Check if we need to start the server in a new terminal
# if command -v osascript &> /dev/null && [[ "$OSTYPE" == "darwin"* ]]; then
#   # macOS - use AppleScript to open a new terminal (Removed due to syntax issues)
#   # osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd | sed 's/'/'\\\\''/g')' && yarn mcp:start\""
# fi # Ensure the commented block is properly terminated or removed if not needed

# Check for Linux/GNOME separately
if command -v gnome-terminal &> /dev/null; then
  # Linux with GNOME
  gnome-terminal -- bash -c "cd \"$(pwd)\" && yarn mcp:start; exec bash"
elif [[ "$OSTYPE" != "darwin"* ]]; then 
  # Handle other non-macOS systems if necessary, or just fall through
  echo "Unsupported OS for automatic terminal launch. Starting in current terminal."
  echo "Starting MCP server in the current terminal..."
  echo "Press Ctrl+C to stop the server when done."
  yarn mcp:start
else
  # macOS and systems without gnome-terminal will run here
  echo "Starting MCP server in the current terminal..."
  echo "Press Ctrl+C to stop the server when done."
  yarn mcp:start
fi

# Wait for the server to start
echo "Waiting for MCP server to initialize..."
sleep 5

# Test connection to MCP server
echo "Testing connection to MCP server..."
if curl -s http://localhost:3000/health &> /dev/null; then
  echo "MCP server is running!"
else
  echo "Warning: Could not connect to MCP server. It may still be starting up."
fi

echo "MCP Tools setup complete!"
echo "You can now use VS Code extension to communicate with the MCP server."