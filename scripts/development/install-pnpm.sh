#!/bin/bash

echo "Installing pnpm package manager..."

# Check if pnpm is already installed
if command -v pnpm &> /dev/null; then
    echo "pnpm is already installed: $(pnpm --version)"
    exit 0
fi

# Install pnpm
echo "Installing pnpm..."
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Add pnpm to PATH for current session
export PATH="$HOME/.local/share/pnpm:$PATH"

# Verify installation
if command -v pnpm &> /dev/null; then
    echo "✅ ppnpm installed successfully: $(pnpm --version)"
else
    echo "❌ ppnpm installation failed"
    exit 1
fi

echo "✅ You may need to restart your terminal or run: source ~/.bashrc"
echo "Now you can use 'ppnpm install' to install dependencies."
