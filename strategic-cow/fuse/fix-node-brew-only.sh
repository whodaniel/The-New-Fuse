#!/bin/bash

# Simpler Homebrew-only fix for Node.js installation
# Use this if you prefer Homebrew over nvm

set -e

echo "======================================"
echo "Homebrew Node.js Fix Script"
echo "======================================"
echo ""

# Step 1: Clean up locks
echo "Step 1: Removing all Homebrew locks..."
sudo rm -rf /usr/local/var/homebrew/locks
sudo mkdir -p /usr/local/var/homebrew/locks
echo "✓ Locks removed"
echo ""

# Step 2: Kill any hanging brew processes
echo "Step 2: Killing any hanging Homebrew processes..."
pkill -9 brew 2>/dev/null || true
echo "✓ Processes killed"
echo ""

# Step 3: Clean up Homebrew
echo "Step 3: Cleaning Homebrew..."
brew cleanup --prune=all
echo "✓ Cleanup complete"
echo ""

# Step 4: Update Homebrew
echo "Step 4: Updating Homebrew..."
brew update-reset
brew update
echo "✓ Homebrew updated"
echo ""

# Step 5: Remove broken installations
echo "Step 5: Removing any broken Node.js installations..."
brew uninstall --force --ignore-dependencies node 2>/dev/null || true
brew uninstall --force --ignore-dependencies z3 2>/dev/null || true
brew uninstall --force --ignore-dependencies llvm 2>/dev/null || true
echo "✓ Broken installations removed"
echo ""

# Step 6: Install Node.js
echo "Step 6: Installing Node.js via Homebrew..."
brew install node
echo "✓ Node.js installed"
echo ""

# Step 7: Verify installation
echo "Step 7: Verifying installation..."
node --version
npm --version
echo "✓ Verification complete"
echo ""

# Step 8: Install CLIs
echo "Step 8: Installing Claude and Gemini CLIs..."

# Install Claude CLI
if ! command -v claude &> /dev/null; then
    echo "Installing Claude CLI..."
    npm install -g @anthropic-ai/claude-code
    echo "✓ Claude CLI installed"
else
    echo "Claude CLI already installed"
fi

# Install Gemini CLI (correct package name)
if ! command -v gemini &> /dev/null; then
    echo "Installing Gemini CLI..."
    # Note: Install the actual Google Gemini CLI package
    npm install -g @google/genai-cli
    echo "✓ Gemini CLI installed"
else
    echo "Gemini CLI already installed"
fi

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "Run 'claude --version' to verify Claude CLI"
echo "Run 'gemini --version' to verify Gemini CLI"
