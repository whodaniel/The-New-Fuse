#!/bin/bash

echo "Reloading The New Fuse extension with correct metadata..."

# Ensure the extension directory is properly set up
mkdir -p out
mkdir -p ai-communication

# Make sure package.json has the correct publisher and name
cat > package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination for VS Code",
  "version": "0.1.0",
  "publisher": "thefuse",
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
      }
    ]
  }
}
EOF

# Uninstall any previous version if it exists
code --uninstall-extension thefuse.the-new-fuse-vscode 2>/dev/null || true

# Install the extension from the current directory
if code --install-extension "$(pwd)" 2>/dev/null; then
  echo "Extension installed successfully!"
else
  echo "Installing using development mode instead..."
  code --extensionDevelopmentPath="$(pwd)"
fi

echo "Extension should now be correctly loaded with ID: thefuse.the-new-fuse-vscode"
echo "If VS Code is already open, use Command Palette > Developer: Reload Window"
