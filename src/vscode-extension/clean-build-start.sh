#!/bin/bash

# Remove any previous output
rm -rf out
mkdir -p out

# Ensure all needed files are present
# required_files=(
#   "src/agent-communication.ts"
#   "src/lm-api-bridge.ts"
#   "src/ai-collaboration.ts"
#   "src/collaborative-completion.ts"
#   "src/ai-coder-integration.ts"
#   "src/llm-orchestrator.ts"
#   "src/workflow-engine.ts"
#   "src/file-protocol-communicator.ts"
#   "src/agent-adapter.ts"
#   "src/extension.ts"
#   "src/startup.ts"
#   "package.json"
#   "tsconfig.json"
# )

# missing=0
# for file in "${required_files[@]}"; do
#   if [ ! -f "$file" ]; then
#     echo "Missing required file: $file"
#     missing=1
#   fi
# done

# if [ $missing -eq 1 ]; then
#   echo "Please ensure all required files are present. Aborting."
#   exit 1
# fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript files
echo "Compiling TypeScript..."
npm run compile

# Check if compilation succeeded
if [ $? -ne 0 ]; then
  echo "Compilation failed. Please fix the errors and try again."
  exit 1
fi

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)"

echo "Extension is now running in VS Code!"
