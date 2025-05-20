#!/bin/bash

# Fix VS Code extension dependencies and prepare for packaging
echo "======================================================"
echo "      Fixing Dependencies for The New Fuse Extension   "
echo "======================================================"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Ensure we're in the extension directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Installing core dependencies...${NC}"
npm install --save-dev @types/vscode@1.85.0 @types/node@20 @types/mocha @types/jest @types/ws web-tree-sitter

echo -e "${YELLOW}Step 2: Installing missing runtime dependencies...${NC}"
npm install --save ws axios zod rxjs uuid minimatch lodash reflect-metadata

echo -e "${YELLOW}Step 3: Creating tsconfig.strict.json for more detailed error checking...${NC}"
cat > tsconfig.strict.json << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noImplicitAny": true,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
EOF

echo -e "${YELLOW}Step 4: Creating minimal .vscode/launch.json if it doesn't exist...${NC}"
mkdir -p .vscode
if [ ! -f ".vscode/launch.json" ]; then
  cat > .vscode/launch.json << EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=\${workspaceFolder}"
      ],
      "outFiles": [
        "\${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "\${defaultBuildTask}"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=\${workspaceFolder}",
        "--extensionTestsPath=\${workspaceFolder}/dist/test/suite/index"
      ],
      "outFiles": [
        "\${workspaceFolder}/dist/test/**/*.js"
      ],
      "preLaunchTask": "\${defaultBuildTask}"
    }
  ]
}
EOF
fi

echo -e "${YELLOW}Step 5: Running npm audit fix to resolve security issues...${NC}"
npm audit fix || true

echo -e "${YELLOW}Step 6: Creating types directory for missing types...${NC}"
mkdir -p src/types
# Create a basic types file to fix some of the imports
cat > src/types/agent-communication.ts << EOF
export interface AgentMessage {
  id: string;
  timestamp: number;
  type: string;
  sender: string;
  recipient: string;
  payload: any;
  processed?: boolean;
  metadata?: Record<string, any>;
  command?: string;
}

export interface AgentRegistration {
  id: string;
  name: string;
  provider: string;
  version: string;
  capabilities: string[];
  lastSeen: number;
}

export interface WebViewMessage {
  type: string;
  text?: string;
  payload?: any;
}

export enum MessageType {
  USER_MESSAGE = 'USER_MESSAGE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE',
  AI_MESSAGE = 'AI_MESSAGE',
  ERROR_MESSAGE = 'ERROR_MESSAGE',
  STATUS_UPDATE = 'STATUS_UPDATE'
}

export interface AIMessage {
  type: MessageType;
  text: string;
  sender?: string;
  timestamp: number;
}
EOF

echo -e "${YELLOW}Step 7: Fixing logging utilities...${NC}"
mkdir -p src/core 
cat > src/core/logging.ts << EOF
import * as vscode from 'vscode';

// Output channel for logging
let outputChannel: vscode.OutputChannel;

// Initialize the output channel
export function initializeLogging(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('The New Fuse');
  }
  return outputChannel;
}

export class Logger {
  constructor(private channel?: vscode.OutputChannel) {
    if (!channel) {
      this.channel = initializeLogging();
    }
  }

  info(message: string): void {
    this.channel?.appendLine(\`INFO: \${message}\`);
  }

  debug(message: string, data?: any): void {
    if (data) {
      this.channel?.appendLine(\`DEBUG: \${message} \${JSON.stringify(data, null, 2)}\`);
    } else {
      this.channel?.appendLine(\`DEBUG: \${message}\`);
    }
  }

  error(message: string, error?: any): void {
    if (error) {
      this.channel?.appendLine(\`ERROR: \${message} \${error instanceof Error ? error.message : JSON.stringify(error)}\`);
      console.error(message, error);
    } else {
      this.channel?.appendLine(\`ERROR: \${message}\`);
      console.error(message);
    }
  }

  warn(message: string): void {
    this.channel?.appendLine(\`WARNING: \${message}\`);
    console.warn(message);
  }

  showError(message: string, error?: any): void {
    this.error(message, error);
    vscode.window.showErrorMessage(\`\${message}\${error ? \`: \${error instanceof Error ? error.message : error}\` : ''}\`);
  }

  showInfo(message: string): void {
    this.info(message);
    vscode.window.showInformationMessage(message);
  }
}

// Singleton instance
let loggerInstance: Logger;

// Get or create logger instance
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(initializeLogging());
  }
  return loggerInstance;
}

// Export standalone functions that use the singleton
export function log(message: string): void {
  getLogger().info(message);
}

export function logError(message: string, error?: any): void {
  getLogger().error(message, error);
}

export function logWarning(message: string): void {
  getLogger().warn(message);
}

export function showError(message: string, error?: any): void {
  getLogger().showError(message, error);
}

export function showInfo(message: string): void {
  getLogger().showInfo(message);
}

// For compatibility with existing code that expects ExtensionLogger
export type ExtensionLogger = Logger;
EOF

echo -e "${YELLOW}Step 8: Creating a minimal typings.d.ts file...${NC}"
cat > typings.d.ts << EOF
declare module 'web-tree-sitter' {
  export default class TreeSitter {
    static init(): Promise<void>;
    static Language: {
      load(path: string): Promise<any>;
    };
  }

  export class Parser {
    setLanguage(language: any): void;
    parse(text: string): any;
  }
}
EOF

echo -e "${YELLOW}Step 9: Checking tsconfig.json settings...${NC}"
# Create a script to check and fix tsconfig.json
cat > check-tsconfig.js << EOF
const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');

try {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  let modified = false;

  // Ensure we have correct compiler options
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
    modified = true;
  }

  // Make sure types are included
  if (!tsconfig.compilerOptions.types) {
    tsconfig.compilerOptions.types = ["node", "vscode", "mocha", "jest"];
    modified = true;
  } else if (!tsconfig.compilerOptions.types.includes("vscode")) {
    tsconfig.compilerOptions.types.push("vscode");
    modified = true;
  }

  // Add typeRoots if missing
  if (!tsconfig.compilerOptions.typeRoots) {
    tsconfig.compilerOptions.typeRoots = ["./node_modules/@types", "./typings"];
    modified = true;
  }

  // Set other important options
  const optionsToEnsure = {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "dist",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": ".",
    "skipLibCheck": true,
    "esModuleInterop": true
  };

  for (const [key, value] of Object.entries(optionsToEnsure)) {
    if (tsconfig.compilerOptions[key] !== value) {
      tsconfig.compilerOptions[key] = value;
      modified = true;
    }
  }

  // Ensure include is set correctly
  if (!tsconfig.include || !Array.isArray(tsconfig.include) || 
      !tsconfig.include.includes("**/*")) {
    tsconfig.include = ["**/*"];
    modified = true;
  }

  // Ensure exclude is set correctly
  const excludesToEnsure = ["node_modules", "dist"];
  if (!tsconfig.exclude) {
    tsconfig.exclude = excludesToEnsure;
    modified = true;
  } else {
    for (const exclude of excludesToEnsure) {
      if (!tsconfig.exclude.includes(exclude)) {
        tsconfig.exclude.push(exclude);
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('Updated tsconfig.json with required settings');
  } else {
    console.log('tsconfig.json already has all required settings');
  }
} catch (error) {
  console.error('Error processing tsconfig.json:', error);
  process.exit(1);
}
EOF

node check-tsconfig.js
rm check-tsconfig.js

echo -e "${GREEN}✅ Dependencies and configuration fixes applied!${NC}"
echo ""
echo "Next steps:"
echo "1. Try building the extension with: ./build.sh"
echo "2. If build succeeds, package the extension with: ./package-extension.sh"
echo ""
echo "======================================================"