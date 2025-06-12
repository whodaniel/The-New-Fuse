#!/bin/bash

# The New Fuse VS Code Extension Setup Script
# This script sets up the development environment for the VS Code extension

set -e

echo "🚀 Setting up The New Fuse VS Code Extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install VS Code Extension CLI if not present
if ! command -v vsce &> /dev/null; then
    echo "📦 Installing VS Code Extension CLI..."
    npm install -g @vscode/vsce
fi

echo "✅ @vscode/vsce $(vsce --version) found"

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Run linting
echo "🔍 Running linter..."
npm run lint

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure your backend server settings"
echo "  2. Build the extension: npm run package"
echo "  3. Install in VS Code: code --install-extension new-fuse-copilot-extension-1.0.0.vsix"
echo ""
echo "Development commands:"
echo "  npm run watch     - Watch mode for development"
echo "  npm run compile   - Compile TypeScript"
echo "  npm run package   - Create .vsix package"
echo "  npm run lint      - Run ESLint"
echo ""
