#!/bin/bash

# Create proper directory structure
mkdir -p out
mkdir -p test
mkdir -p web-ui
mkdir -p .vscode

# Create a basic package.json with correct scripts
echo '{
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
    "uuid": "^9.0.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@types/glob": "^8.1.0",
    "@types/mocha": "^10.0.1",
    "@types/node": "20.2.5",
    "@types/uuid": "^9.0.1",
    "@types/vscode": "^1.80.0",
    "@typescript-eslint/eslint-plugin": "^5.59.8",
    "@typescript-eslint/parser": "^5.59.8",
    "@vscode/test-electron": "^2.3.8",
    "eslint": "^8.41.0",
    "glob": "^8.1.0",
    "mocha": "^10.2.0",
    "typescript": "^5.1.3"
  }
}' > package.json

# Create a basic tsconfig.json
echo '{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}' > tsconfig.json

# Create .vscode/tasks.json
echo '{
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
}' > .vscode/tasks.json

# Make setup script executable
chmod +x setup.sh

echo "Setup complete! Run these commands to get started:"
echo "npm install"
echo "npm run compile"
echo "code --extensionDevelopmentPath=\$(pwd)"
