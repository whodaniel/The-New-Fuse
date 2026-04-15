#!/bin/bash

# Script to activate The New Fuse extension and establish communication with Copilot

echo "Activating The New Fuse extension and establishing communication with Copilot..."

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "Error: VS Code is not installed or not in PATH"
    exit 1
fi

# Check if The New Fuse extension is installed
if ! code --list-extensions | grep -q "thenewfuse.the-new-fuse"; then
    echo "Error: The New Fuse extension is not installed"
    exit 1
fi

# Check if GitHub Copilot is installed
if ! code --list-extensions | grep -q "github.copilot"; then
    echo "Error: GitHub Copilot extension is not installed"
    exit 1
fi

# Check if Redis server is running
if ! ps aux | grep -q "[r]edis-server"; then
    echo "Warning: Redis server does not appear to be running"
    echo "Starting Redis server..."
    
    # Try to start Redis server
    if command -v redis-server &> /dev/null; then
        redis-server &
    else
        echo "Error: Redis server not found. Please install Redis or start it manually"
        exit 1
    fi
fi

echo "Prerequisites checked successfully"

# Create a temporary script to run VS Code commands
TMP_SCRIPT=$(mktemp)
cat > "$TMP_SCRIPT" << 'EOF'
const vscode = require('vscode');

async function activateFuse() {
    try {
        // Show discovered agents
        await vscode.commands.executeCommand('thefuse.showAgents');
        console.log('Showed discovered agents');
        
        // Refresh agent discovery
        await vscode.commands.executeCommand('thefuse.discoverAgents');
        console.log('Refreshed agent discovery');
        
        // Open workflow builder
        await vscode.commands.executeCommand('thefuse.openWorkflowBuilder');
        console.log('Opened workflow builder');
        
        console.log('The New Fuse activation completed successfully');
    } catch (error) {
        console.error('Error activating The New Fuse:', error);
    }
}

activateFuse();
EOF

echo "Created activation script"

# Instructions for the user
echo ""
echo "To complete activation, please:"
echo "1. Open VS Code"
echo "2. Open the Command Palette (Cmd+Shift+P on Mac, Ctrl+Shift+P on Windows/Linux)"
echo "3. Run 'The New Fuse: Show Discovered AI Agents'"
echo "4. Run 'The New Fuse: Refresh Agent Discovery'"
echo "5. Run 'The New Fuse: Open Workflow Builder'"
echo ""
echo "Alternatively, you can run the following commands in a JavaScript Debug Terminal in VS Code:"
echo "node $TMP_SCRIPT"
echo ""
echo "For more information, see the comprehensive guide: the-new-fuse-guide.md"

# Clean up
echo "Temporary script created at: $TMP_SCRIPT"
echo "You can delete it after use"

echo "Activation process completed"
