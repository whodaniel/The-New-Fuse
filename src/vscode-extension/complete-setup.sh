#!/bin/bash

# Create a proper directory structure
mkdir -p out
mkdir -p test
mkdir -p web-ui
mkdir -p .vscode
mkdir -p ai-communication  # For file-based inter-extension communication

# Copy all the full implementation files into the right places
cp agent-communication.ts .
cp lm-api-bridge.ts .
cp ai-collaboration.ts .
cp collaborative-completion.ts .
cp ai-coder-integration.ts .
cp llm-orchestrator.ts .
cp workflow-engine.ts .
cp file-protocol-communicator.ts .
cp agent-adapter.ts .
cp extension.ts .
cp startup.ts .

# Copy helper files
cp test/example-code.ts test/
cp QUICK-START.md .
cp README.md .
cp TROUBLESHOOTING.md .

# Create a proper tsconfig.json
echo '{
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
}' > tsconfig.json

# Install required dependencies
npm init -y
npm install uuid crypto vscode
npm install --save-dev @types/uuid @types/vscode typescript

# Make the script executable
chmod +x complete-setup.sh

echo "Complete featured setup done! Now run:"
echo "npm install"
echo "npm run compile"
echo "code --extensionDevelopmentPath=$(pwd)"
