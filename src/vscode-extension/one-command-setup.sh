#!/bin/bash

echo "======================================================"
echo "  The New Fuse - VS Code Extension One-Command Setup"
echo "======================================================"
echo ""

# Create all required directories
echo "Creating directory structure..."
mkdir -p out
mkdir -p test
mkdir -p web-ui
mkdir -p .vscode
mkdir -p ai-communication

# Check for existing files and back them up if needed
if [ -f "package.json" ]; then
  echo "Backing up existing package.json..."
  cp package.json package.json.bak
fi

if [ -f "tsconfig.json" ]; then
  echo "Backing up existing tsconfig.json..."
  cp tsconfig.json tsconfig.json.bak
fi

# Create or update package.json
echo "Setting up package.json..."
cat > package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination and workflow automation for VS Code",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "publisher": "thefuse",
  "categories": [
    "Other",
    "Machine Learning",
    "Programming Languages"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "thefuse.openWebUI",
        "title": "Open The New Fuse UI"
      },
      {
        "command": "thefuse.startAICollab",
        "title": "Start AI Collaboration"
      },
      {
        "command": "llm-orchestrator.showAgents",
        "title": "Show AI Agents"
      },
      {
        "command": "llm-orchestrator.discoverAgents",
        "title": "Discover AI Agents"
      },
      {
        "command": "llm-orchestrator.createCollaborativeTask",
        "title": "Create AI Collaborative Task"
      },
      {
        "command": "thefuse.ai.startCollaboration",
        "title": "Start AI Collaboration Workflow"
      },
      {
        "command": "thefuse.ai.executeTask",
        "title": "Execute AI Task"
      },
      {
        "command": "thefuse.lm.generate",
        "title": "Generate Text with Language Model"
      },
      {
        "command": "thefuse.sendFileMessage",
        "title": "Send Message via File Protocol"
      },
      {
        "command": "thefuse.toggleCollaborativeCompletion",
        "title": "Toggle Collaborative Completion Mode"
      },
      {
        "command": "thefuse.startCollaborativeCoding",
        "title": "Start Collaborative Coding with AI Team"
      },
      {
        "command": "thefuse.analyzeCodeProblem",
        "title": "Analyze Code Problem with AI Team"
      },
      {
        "command": "thefuse.ai.startCollaborativeCoding",
        "title": "Start AI Collaborative Coding"
      },
      {
        "command": "thefuse.ai.analyzeCodeProblem",
        "title": "Analyze Code Problem"
      },
      {
        "command": "thefuse.ai.consultCoder",
        "title": "Consult Specific AI Coder"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "thefuse.startAICollab",
          "group": "navigation"
        },
        {
          "command": "thefuse.startCollaborativeCoding",
          "group": "navigation"
        },
        {
          "command": "thefuse.analyzeCodeProblem",
          "group": "navigation"
        }
      ]
    },
    "configuration": {
      "title": "The New Fuse",
      "properties": {
        "theFuse.defaultLmProvider": {
          "type": "string",
          "default": "copilot",
          "enum": ["copilot", "anthropic", "openai", "huggingface", "local"],
          "description": "Default language model provider to use"
        },
        "theFuse.enableDebugLogging": {
          "type": "boolean",
          "default": false,
          "description": "Enable detailed logging for debugging"
        },
        "theFuse.fileProtocolDir": {
          "type": "string",
          "default": "ai-communication",
          "description": "Directory for file-based inter-extension communication"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  },
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "20.2.5",
    "@types/uuid": "^9.0.1",
    "@types/vscode": "^1.80.0",
    "typescript": "^5.1.3"
  }
}
EOF

# Create tsconfig.json
echo "Setting up tsconfig.json..."
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

# Create launch.json for VS Code
echo "Setting up VS Code debugging configuration..."
mkdir -p .vscode
cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "npm: watch"
    }
  ]
}
EOF

# Create tasks.json for VS Code
echo "Setting up VS Code tasks..."
cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "watch",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "presentation": {
        "reveal": "never"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
EOF

# Create the example code file for testing
echo "Creating example code for testing..."
mkdir -p test
cat > test/example-code.ts << 'EOF'
/**
 * Example code file for testing AI collaboration features
 */

// A simple function with some performance issues to optimize
function findDuplicates(array: number[]): number[] {
  const duplicates: number[] = [];
  
  // Inefficient algorithm - O(n²) complexity
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      if (array[i] === array[j] && !duplicates.includes(array[i])) {
        duplicates.push(array[i]);
      }
    }
  }
  
  return duplicates;
}

// Poorly documented class that needs improvement
class DataProcessor {
  private data: any[];
  
  constructor(initialData: any[]) {
    this.data = initialData;
  }
  
  process() {
    let result = [];
    for (let i = 0; i < this.data.length; i++) {
      let item = this.data[i];
      if (item && typeof item === 'object') {
        result.push({
          id: item.id || Math.random().toString(36).substr(2, 9),
          value: item.value,
          processed: true,
          timestamp: Date.now()
        });
      }
    }
    return result;
  }
  
  filter(predicate: (item: any) => boolean) {
    return this.data.filter(predicate);
  }
  
  transform(transformer: (item: any) => any) {
    return this.data.map(transformer);
  }
}

// Export the components
export { findDuplicates, DataProcessor };
EOF

# Determine which implementation to use based on file availability
if [ -f "agent-communication.ts" ] && [ -f "ai-coder-integration.ts" ]; then
  echo "Full implementation files found, using those..."
  USE_FULL_IMPL=true
else
  echo "Full implementation files not found, using simplified versions..."
  USE_FULL_IMPL=false
  
  # Create simplified versions of core files
  echo "Creating simplified implementation files..."
  
  # Create simplified agent-communication file
  cat > agent-communication-simple.ts << 'EOF'
import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: number;
}

export class AgentClient {
  private context: vscode.ExtensionContext;
  private agentId: string;
  private messageCallbacks: ((message: AgentMessage) => Promise<void>)[] = [];
  
  constructor(context: vscode.ExtensionContext, agentId: string) {
    this.context = context;
    this.agentId = agentId;
    
    // Set up polling for workspace state messages
    setInterval(() => this.checkForMessages(), 1000);
  }
  
  // Register this agent
  async register(name: string, capabilities: string[], version: string): Promise<boolean> {
    // Store registration in workspace state
    const registrations = this.context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
    registrations.push({
      id: this.agentId,
      name,
      capabilities,
      version,
      timestamp: Date.now()
    });
    await this.context.workspaceState.update('thefuse.agentRegistrations', registrations);
    return true;
  }
  
  // Send a message to another agent
  async sendMessage(recipient: string, action: string, payload: any): Promise<boolean> {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      sender: this.agentId,
      recipient,
      action,
      payload,
      timestamp: Date.now()
    };
    
    // Add message to workspace state
    const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
    messages.push(message);
    await this.context.workspaceState.update('thefuse.messages', messages);
    return true;
  }
  
  // Broadcast a message to all agents
  async broadcast(action: string, payload: any): Promise<boolean> {
    return this.sendMessage('*', action, payload);
  }
  
  // Subscribe to receive messages
  async subscribe(callback: (message: AgentMessage) => Promise<void>): Promise<boolean> {
    this.messageCallbacks.push(callback);
    return true;
  }
  
  // Check for new messages
  private async checkForMessages(): Promise<void> {
    const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
    if (messages.length === 0) return;
    
    // Find messages for this agent
    const myMessages = messages.filter(m => 
      m.recipient === this.agentId || 
      m.recipient === '*'
    );
    
    if (myMessages.length === 0) return;
    
    // Process messages
    for (const message of myMessages) {
      for (const callback of this.messageCallbacks) {
        await callback(message);
      }
    }
    
    // Remove processed messages
    const remainingMessages = messages.filter(m => 
      m.recipient !== this.agentId && 
      m.recipient !== '*'
    );
    await this.context.workspaceState.update('thefuse.messages', remainingMessages);
  }
}

// Export factory functions
export function initializeOrchestrator(context: vscode.ExtensionContext): any {
  // Simple placeholder for the full orchestrator
  return {
    getRegisteredAgents: () => {
      return context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
    }
  };
}

export function createAgentClient(context: vscode.ExtensionContext, agentId: string): AgentClient {
  return new AgentClient(context, agentId);
}
EOF

  # Create a simple extension.ts
  cat > extension.ts << 'EOF'
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('The New Fuse extension is now active!');
  
  // Register a simple command to verify the extension is working
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  // Register a basic version of the AI collaboration command
  const startAICollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration will be available soon!');
  });
  
  // Register other placeholder commands
  const analyzeCodeCommand = vscode.commands.registerCommand('thefuse.analyzeCodeProblem', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }
    
    vscode.window.showInformationMessage('Code analysis feature will be available soon!');
  });
  
  // Add a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(
    helloCommand,
    startAICollabCommand,
    analyzeCodeCommand,
    statusBarItem
  );
  
  // Show welcome message
  vscode.window.showInformationMessage('The New Fuse extension is now active!',
    'Learn More'
  ).then(selection => {
    if (selection === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-username/the-new-fuse'));
    }
  });
}

export function deactivate() {
  console.log('The New Fuse extension is now deactivated');
}
EOF
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Install TypeScript globally if it's not already installed
if ! command -v tsc &> /dev/null; then
  echo "TypeScript not found, installing globally..."
  npm install -g typescript
fi

# Install required dev dependencies
echo "Installing development dependencies..."
npm install --save-dev @types/vscode @types/node @types/uuid typescript

# Compile TypeScript files
echo "Compiling TypeScript files..."
npm run compile

# Check if compilation succeeded
if [ $? -ne 0 ]; then
  echo "⚠️ Compilation failed. Please check for errors in your TypeScript files."
  echo "  You can still continue to try launching the extension."
else
  echo "✅ Compilation successful!"
fi

# Launch options
echo ""
echo "Would you like to launch VS Code with the extension now? (y/n)"
read -r LAUNCH_NOW

if [[ $LAUNCH_NOW =~ ^[Yy]$ ]]; then
  # Try to find VS Code
  VSCODE_PATH=""
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
      VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v code &> /dev/null; then
      VSCODE_PATH="code"
    fi
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows with Git Bash or similar
    if command -v code.cmd &> /dev/null; then
      VSCODE_PATH="code.cmd"
    fi
  fi
  
  if [ -z "$VSCODE_PATH" ] && command -v code &> /dev/null; then
    VSCODE_PATH="code"
  fi
  
  if [ -n "$VSCODE_PATH" ]; then
    echo "Launching VS Code with the extension..."
    "$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
  else
    echo "⚠️ Could not find VS Code executable. Please launch VS Code manually:"
    echo "code --extensionDevelopmentPath=\"$(pwd)\""
  fi
fi

echo ""
echo "============================================================"
echo "  Setup complete! 🎉"
echo "============================================================"
echo ""
echo "You can now use the extension in VS Code. If you encounter any issues,"
echo "check the TROUBLESHOOTING.md file or run:"
echo ""
echo "  code --extensionDevelopmentPath=\"$(pwd)\""
echo ""
echo "To see debug logs, open the Output panel in VS Code (View > Output)"
echo "and select 'The New Fuse' from the dropdown."
echo ""
