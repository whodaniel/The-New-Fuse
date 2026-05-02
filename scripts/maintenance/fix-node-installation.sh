#!/bin/bash

# Fix Node.js and CLI Installation Script
# This script will fix Homebrew issues and install Node.js, Claude CLI, and Gemini CLI

set -e  # Exit on error

echo "======================================"
echo "Node.js & CLI Installation Fix Script"
echo "======================================"
echo ""

# Step 1: Clean up Homebrew locks and broken installations
echo "Step 1: Cleaning up Homebrew..."
echo "------------------------------"

# Remove any lock files
rm -f /usr/local/var/homebrew/locks/*.lock 2>/dev/null || true
rm -f /usr/local/var/homebrew/locks/**/*.lock 2>/dev/null || true

# Clean up any partial installations
brew cleanup --prune=all 2>/dev/null || true

echo "✓ Homebrew cleanup complete"
echo ""

# Step 2: Update and fix Homebrew
echo "Step 2: Updating Homebrew..."
echo "----------------------------"

# Reset Homebrew to clean state
brew update-reset

# Update Homebrew
brew update

echo "✓ Homebrew updated"
echo ""

# Step 3: Uninstall any broken Node.js installations
echo "Step 3: Removing broken Node.js installations..."
echo "-----------------------------------------------"

brew uninstall --force --ignore-dependencies node 2>/dev/null || true
brew uninstall --force --ignore-dependencies node@20 2>/dev/null || true
brew uninstall --force --ignore-dependencies node@18 2>/dev/null || true

echo "✓ Broken installations removed"
echo ""

# Step 4: Install Node.js using alternative method (nvm)
echo "Step 4: Installing Node.js via nvm (Node Version Manager)..."
echo "----------------------------------------------------------"

# Check if nvm is installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "nvm already installed"
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install latest LTS version of Node.js
echo "Installing Node.js LTS..."
nvm install --lts
nvm use --lts
nvm alias default node

echo "✓ Node.js installed via nvm"
echo ""

# Step 5: Verify Node.js installation
echo "Step 5: Verifying Node.js installation..."
echo "-----------------------------------------"

node --version
npm --version

echo "✓ Node.js verification complete"
echo ""

# Step 6: Install Claude CLI
echo "Step 6: Installing Claude CLI..."
echo "--------------------------------"

if command -v claude &> /dev/null; then
    echo "Claude CLI already installed at: $(which claude)"
    claude --version || echo "Warning: Claude CLI installed but may need configuration"
else
    echo "Installing Claude CLI globally..."
    npm install -g @anthropic-ai/claude-code-cli
    echo "✓ Claude CLI installed"
fi

echo ""

# Step 7: Install Gemini CLI
echo "Step 7: Installing Gemini CLI..."
echo "--------------------------------"

if command -v gemini &> /dev/null; then
    echo "Gemini CLI already installed at: $(which gemini)"
else
    echo "Installing Gemini CLI globally..."
    npm install -g @google/generative-ai-cli
    echo "✓ Gemini CLI installed"
fi

echo ""

# Step 8: Add nvm to shell profile (if not already added)
echo "Step 8: Configuring shell profile..."
echo "------------------------------------"

SHELL_PROFILE="$HOME/.zshrc"
NVM_INIT='export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion'

if ! grep -q "NVM_DIR" "$SHELL_PROFILE" 2>/dev/null; then
    echo "" >> "$SHELL_PROFILE"
    echo "# NVM Configuration" >> "$SHELL_PROFILE"
    echo "$NVM_INIT" >> "$SHELL_PROFILE"
    echo "✓ Added nvm to $SHELL_PROFILE"
else
    echo "nvm already configured in $SHELL_PROFILE"
fi

echo ""

# Final verification
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo ""

if command -v claude &> /dev/null; then
    echo "  Claude CLI: $(which claude)"
else
    echo "  Claude CLI: NOT FOUND - may need manual installation"
fi

if command -v gemini &> /dev/null; then
    echo "  Gemini CLI: $(which gemini)"
else
    echo "  Gemini CLI: NOT FOUND - may need manual installation"
fi

echo ""
echo "IMPORTANT: To use these tools in your current terminal, run:"
echo "  source ~/.zshrc"
echo ""
echo "Or close and reopen your terminal."
