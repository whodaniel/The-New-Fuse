#!/bin/bash

echo "Installing Bun package manager..."

# Check if Bun is already installed
if command -v bun &> /dev/null; then
    echo "Bun is already installed: $(bun --version)"
    exit 0
fi

# Install Bun
echo "Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Verify installation
if command -v bun &> /dev/null; then
    echo "✅ Bun installed successfully: $(bun --version)"
else
    echo "❌ Bun installation failed"
    exit 1
fi

echo "✅ You may need to restart your terminal or run: source ~/.bashrc"
echo "Now you can use 'bun install' to install dependencies."
