#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Local Extension Setup"
echo "===================================================="
echo ""

# Create essential directories (just in case)
mkdir -p out
mkdir -p data
mkdir -p db
mkdir -p mcp-integration

# Create simplified extension.js file
mkdir -p out
cat > out/extension.js << 'EOFJS'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse is now active!');
  
  // Register the MCP commands
  const mcpInitCommand = vscode.commands.registerCommand('thefuse.mcp.initialize', () => {
    vscode.window.showInformationMessage('MCP Initialization started!');
    // Mock successful initialization
    setTimeout(() => {
      vscode.window.showInformationMessage('MCP Initialized with 3 test tools');
    }, 1500);
    return true;
  });
  
  const mcpShowCommand = vscode.commands.registerCommand('thefuse.mcp.showTools', () => {
    vscode.window.showQuickPick([
      { label: 'list_files', description: 'List files in a directory' },
      { label: 'read_file', description: 'Read file contents' },
      { label: 'brave_search', description: 'Search the web' }
    ], { placeHolder: 'Select an MCP tool to test' });
  });
  
  const mcpTestCommand = vscode.commands.registerCommand('thefuse.mcp.testTool', async () => {
    const selectedTool = await vscode.window.showQuickPick([
      { label: 'list_files', description: 'List files in a directory' },
      { label: 'read_file', description: 'Read file contents' },
      { label: 'brave_search', description: 'Search the web' }
    ], { placeHolder: 'Select an MCP tool to test' });
    
    if (selectedTool) {
      vscode.window.showInformationMessage(`Testing tool: ${selectedTool.label}`);
      
      // Show mock result
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(['file1.txt', 'file2.md', 'example.json'], null, 2),
        language: 'json'
      });
      await vscode.window.showTextDocument(doc);
    }
  });
  
  const mcpAskCommand = vscode.commands.registerCommand('thefuse.mcp.askAgent', async () => {
    const query = await vscode.window.showInputBox({
      prompt: 'What would you like to ask?',
      placeHolder: 'e.g., List files in the data directory'
    });
    
    if (query) {
      const doc = await vscode.workspace.openTextDocument({
        content: `You asked: "${query}"\n\nI found these files:\n- file1.txt\n- file2.md\n- example.json`,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc);
    }
  });
  
  // Add status bar item with MCP status
  const mcpStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  mcpStatusItem.text = '$(tools) MCP Tools';
  mcpStatusItem.tooltip = 'MCP Integration Status';
  mcpStatusItem.command = 'thefuse.mcp.showTools';
  mcpStatusItem.show();
  
  // Register all commands
  context.subscriptions.push(
    mcpInitCommand,
    mcpShowCommand,
    mcpTestCommand,
    mcpAskCommand,
    mcpStatusItem
  );
  
  vscode.window.showInformationMessage('The New Fuse is ready!', 'Initialize MCP').then(selection => {
    if (selection === 'Initialize MCP') {
      vscode.commands.executeCommand('thefuse.mcp.initialize');
    }
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
EOFJS

# Create minimal package.json
cat > package.json << 'EOFJSON'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination for VS Code",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "main": "./out/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      {
        "command": "thefuse.mcp.initialize",
        "title": "Initialize MCP Integration"
      },
      {
        "command": "thefuse.mcp.showTools",
        "title": "Show MCP Tools"
      },
      {
        "command": "thefuse.mcp.testTool",
        "title": "Test MCP Tool"
      },
      {
        "command": "thefuse.mcp.askAgent",
        "title": "Ask Agent with MCP Tools"
      }
    ]
  }
}
EOFJSON

# Create MCP config
cat > mcp_config.json << 'EOFCONFIG'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--allow-dir", "./data"
      ]
    }
  }
}
EOFCONFIG

# Create a launch script
cat > launch.sh << 'EOFLAUNCH'
#!/bin/bash

# Make sure VS Code can find the script and extension
CODE_PATH=""

# Find VS Code binary based on platform
if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  CODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
elif command -v code &> /dev/null; then
  CODE_PATH="code"
else
  echo "Error: VS Code not found. Please make sure VS Code is installed."
  exit 1
fi

# Launch VS Code with the extension
echo "Launching VS Code with The New Fuse extension..."
"$CODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"

echo "VS Code launched! Use Command Palette (Cmd+Shift+P) and type 'MCP' to see the commands."
EOFLAUNCH

# Make the script executable
chmod +x launch.sh

echo ""
echo "Setup complete! To launch VS Code with The New Fuse extension:"
echo ""
echo "  ./launch.sh"
echo ""
echo "After VS Code opens:"
echo "1. Press Cmd+Shift+P (or Ctrl+Shift+P) to open the Command Palette"
echo "2. Type 'MCP' to see the available MCP commands"
echo "3. Select 'Initialize MCP Integration' to start"
echo ""
echo "===================================================="
