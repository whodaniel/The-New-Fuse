#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Complete Extension Setup"
echo "===================================================="
echo ""

# Navigate to the extension directory
cd src/vscode-extension || {
  echo "Error: VS Code extension directory not found!"
  echo "Creating directory structure..."
  mkdir -p src/vscode-extension
  cd src/vscode-extension
}

# Create necessary directories
mkdir -p out
mkdir -p ai-communication
mkdir -p data
mkdir -p db
mkdir -p mcp-integration

# Copy files from the project root if they exist
if [ -f "../../mcp_config.json" ]; then
  echo "Copying MCP config from project root..."
  cp ../../mcp_config.json .
fi

# Update package.json with MCP commands
echo "Creating package.json with MCP commands..."
cat > package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination and workflow automation for VS Code",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "main": "./out/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      {
        "command": "thefuse.helloWorld",
        "title": "Hello from The New Fuse"
      },
      {
        "command": "thefuse.startAICollab",
        "title": "Start AI Collaboration"
      },
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
      },
      {
        "command": "thefuse.openMcpCommandPalette",
        "title": "Open MCP Command Palette"
      }
    ],
    "configuration": {
      "title": "The New Fuse",
      "properties": {
        "theFuse.mcpConfigPath": {
          "type": "string",
          "default": "",
          "description": "Path to the MCP configuration file"
        },
        "theFuse.autoInitializeMcp": {
          "type": "boolean",
          "default": true,
          "description": "Automatically initialize MCP integration on startup"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  },
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.2.5",
    "@types/uuid": "^9.0.1",
    "@types/vscode": "^1.80.0",
    "typescript": "^5.1.3"
  }
}
EOF

# Create tsconfig.json
echo "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020", "DOM"],
    "sourceMap": true,
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
EOF

# Create a simplified extension.ts file with MCP registration
echo "Creating extension.ts with MCP support..."
cat > extension.ts << 'EOF'
import * as vscode from 'vscode';

// Simple mock for LMAPIBridge since we don't have the full implementation
class SimpleLMAPIBridge {
  async generateText(params: any): Promise<{text: string}> {
    return { text: `Response to: ${params.prompt}` };
  }
}

// Create minimal MCP client
class SimpleMCPClient {
  private tools: any[] = [];
  
  async loadServers(configPath: string): Promise<void> {
    console.log(`[MCPClient] Loading configuration from: ${configPath}`);
  }
  
  async start(): Promise<any[]> {
    this.tools = [
      {
        name: 'list_files',
        description: 'List files in a directory',
        parameters: { type: 'object', properties: { path: { type: 'string' } } },
        execute: async (args: any) => {
          return ['file1.txt', 'file2.txt', 'example.md'];
        }
      },
      {
        name: 'read_file',
        description: 'Read a file content',
        parameters: { type: 'object', properties: { path: { type: 'string' } } },
        execute: async (args: any) => {
          return `Content of ${args.path}`;
        }
      }
    ];
    
    return this.tools;
  }
  
  getTools(): any[] {
    return this.tools;
  }
  
  async cleanup(): Promise<void> {}
}

// Simple MCP Manager
class SimpleMCPManager {
  private tools: any[] = [];
  private lmBridge: SimpleLMAPIBridge;
  private listeners: ((tools: any[]) => void)[] = [];
  
  constructor(private context: vscode.ExtensionContext) {
    this.lmBridge = new SimpleLMAPIBridge();
    
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(tools) MCP';
    statusBarItem.tooltip = 'MCP Tools';
    statusBarItem.command = 'thefuse.mcp.showTools';
    statusBarItem.show();
  }
  
  async initialize(): Promise<boolean> {
    try {
      const client = new SimpleMCPClient();
      await client.loadServers('./mcp_config.json');
      this.tools = await client.start();
      
      // Notify listeners
      this.notifyListeners();
      
      vscode.window.showInformationMessage(`Initialized MCP with ${this.tools.length} tools`);
      return true;
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to initialize MCP: ${error.message}`);
      return false;
    }
  }
  
  getTools(): any[] {
    return this.tools;
  }
  
  onToolsChanged(listener: (tools: any[]) => void): vscode.Disposable {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }
  
  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.tools);
    }
  }
  
  async dispose() {}
}

export function activate(context: vscode.ExtensionContext) {
  console.log('The New Fuse extension is now active!');
  
  // Create a simple LM API Bridge
  const lmBridge = new SimpleLMAPIBridge();
  
  // Create MCP Manager
  const mcpManager = new SimpleMCPManager(context);
  
  // Register core commands
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  const aiCollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration initiated!');
  });
  
  // Register MCP commands
  const mcpInitCommand = vscode.commands.registerCommand('thefuse.mcp.initialize', async () => {
    return await mcpManager.initialize();
  });
  
  const mcpShowToolsCommand = vscode.commands.registerCommand('thefuse.mcp.showTools', async () => {
    const tools = mcpManager.getTools();
    if (tools.length === 0) {
      const shouldInit = await vscode.window.showWarningMessage(
        'No MCP tools available. Initialize MCP first?',
        'Yes', 'No'
      );
      
      if (shouldInit === 'Yes') {
        await mcpManager.initialize();
      }
      return;
    }
    
    // Show tools in quick pick
    const items = tools.map(tool => ({
      label: tool.name,
      description: tool.description,
      tool
    }));
    
    vscode.window.showQuickPick(items, {
      placeHolder: 'Select an MCP tool'
    });
  });
  
  const mcpTestToolCommand = vscode.commands.registerCommand('thefuse.mcp.testTool', async (toolName?: string) => {
    const tools = mcpManager.getTools();
    if (tools.length === 0) {
      vscode.window.showWarningMessage('No MCP tools available. Initialize MCP first.');
      return;
    }
    
    // If no tool name provided, show quick pick
    if (!toolName) {
      const items = tools.map(tool => ({
        label: tool.name,
        description: tool.description,
        tool
      }));
      
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a tool to test'
      });
      
      if (!selected) return;
      toolName = selected.tool.name;
    }
    
    // Find the tool
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      vscode.window.showErrorMessage(`Tool "${toolName}" not found`);
      return;
    }
    
    try {
      // Execute the tool with sample args
      const result = await tool.execute({ path: './sample' });
      
      // Show result
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(result, null, 2),
        language: 'json'
      });
      await vscode.window.showTextDocument(doc);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error executing tool: ${error.message}`);
    }
  });
  
  const mcpAskAgentCommand = vscode.commands.registerCommand('thefuse.mcp.askAgent', async (query?: string) => {
    // If no query provided, ask for one
    if (!query) {
      query = await vscode.window.showInputBox({
        prompt: 'What would you like to ask?',
        placeHolder: 'e.g., List files in the data directory'
      });
      
      if (!query) return; // User cancelled
    }
    
    // Get tools
    const tools = mcpManager.getTools();
    
    // Generate response (simplified)
    let response: string;
    if (tools.length > 0 && (query.includes('file') || query.includes('list'))) {
      // Simulate tool use
      response = `I found these files in the directory:\n- file1.txt\n- file2.txt\n- example.md`;
    } else {
      response = `I don't have access to tools to help with that query. Here's a simple response: ${query}`;
    }
    
    // Show response
    const doc = await vscode.workspace.openTextDocument({
      content: response,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
  });
  
  // Register all commands
  context.subscriptions.push(
    helloCommand,
    aiCollabCommand,
    mcpInitCommand,
    mcpShowToolsCommand,
    mcpTestToolCommand,
    mcpAskAgentCommand
  );
  
  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.startAICollab';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
EOF

# Create basic MCP config if it doesn't exist
if [ ! -f "mcp_config.json" ]; then
  echo "Creating default MCP config..."
  cat > mcp_config.json << 'EOF'
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
EOF
fi

# Create README in the data directory
mkdir -p data
cat > data/README.md << 'EOF'
# MCP FileSystem Data Directory

This directory is used by the MCP filesystem tool. 
Files placed here will be accessible to the AI agent through the filesystem MCP server.

## Usage Examples

Files in this directory can be accessed using MCP tools like:
- `list_files` - Lists files in this directory
- `read_file` - Reads the content of a file in this directory
- `write_file` - Writes content to a file in this directory
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Create a launch script for VS Code
echo "Creating VS Code launch script..."
cat > launch-vscode.sh << 'EOF'
#!/bin/bash

echo "Launching VS Code with The New Fuse extension..."

# Find VS Code on different platforms
if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
elif command -v code &> /dev/null; then
  VSCODE_PATH="code"
elif command -v code-insiders &> /dev/null; then
  VSCODE_PATH="code-insiders"
else
  echo "Error: Cannot find VS Code. Please make sure VS Code is installed."
  exit 1
fi

# Launch VS Code with the extension
"$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"

echo "VS Code launched with The New Fuse extension."
echo "Use Command Palette (Cmd+Shift+P or Ctrl+Shift+P) and type 'thefuse' to see available commands."
EOF

# Make the launch script executable
chmod +x launch-vscode.sh

# Create a quick reference guide
cat > COMMAND-REFERENCE.md << 'EOF'
# The New Fuse Command Reference

## Available VS Code Commands

All commands can be accessed via the Command Palette (Cmd+Shift+P or Ctrl+Shift+P):

### Core Commands
- `thefuse.helloWorld` - Basic hello world test
- `thefuse.startAICollab` - Start AI Collaboration

### MCP Commands
- `thefuse.mcp.initialize` - Initialize MCP Integration
- `thefuse.mcp.showTools` - Show MCP Tools 
- `thefuse.mcp.testTool` - Test a specific MCP Tool
- `thefuse.mcp.askAgent` - Ask Agent a question using MCP Tools

## Quick Troubleshooting

If commands don't appear in the Command Palette:
1. Make sure the extension is running in development mode:
   ```
   ./launch-vscode.sh
   ```
2. Check the output panel for any errors:
   - View > Output
   - Select "The New Fuse" from the dropdown

3. Try reloading the window:
   - Command Palette > Developer: Reload Window
EOF

echo ""
echo "===================================================="
echo "  Setup Complete! 🎉"
echo "===================================================="
echo ""
echo "To launch VS Code with the extension:"
echo ""
echo "  ./launch-vscode.sh"
echo ""
echo "After VS Code opens, you can:"
echo "1. Open Command Palette (Cmd+Shift+P or Ctrl+Shift+P)"
echo "2. Type 'thefuse' to see all available commands"
echo "3. Try 'Initialize MCP Integration' first, then other MCP commands"
echo ""
echo "See COMMAND-REFERENCE.md for a list of all available commands"
