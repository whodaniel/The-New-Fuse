#!/bin/bash

# TNF Copilot CLI Installer
# Adds 'tnf-copilot' alias to your shell configuration

# Get the absolute path of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLI_TOOL="$PROJECT_ROOT/tools/copilot-cli.js"

# Check if CLI tool exists
if [ ! -f "$CLI_TOOL" ]; then
    echo "❌ Error: Copilot CLI tool not found at $CLI_TOOL"
    exit 1
fi

# Make executable
chmod +x "$CLI_TOOL"
echo "✅ Made tools/copilot-cli.js executable"

# Detect Shell
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    # Fallback/Default
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_CONFIG="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    fi
fi

if [ -z "$SHELL_CONFIG" ]; then
    echo "⚠️  Could not detect shell configuration file (.zshrc or .bashrc)."
    echo "   Please manually add this alias:"
    echo "   alias tnf-copilot='node \"$CLI_TOOL\"'"
else
    # Check if alias already exists
    if grep -q "alias tnf-copilot=" "$SHELL_CONFIG"; then
        echo "ℹ️  Alias 'tnf-copilot' already exists in $SHELL_CONFIG"
    else
        echo "" >> "$SHELL_CONFIG"
        echo "# TNF Copilot CLI Alias" >> "$SHELL_CONFIG"
        echo "alias tnf-copilot='node \"$CLI_TOOL\"'" >> "$SHELL_CONFIG"
        echo "✅ Added 'tnf-copilot' alias to $SHELL_CONFIG"
        echo "   (You may need to run 'source $SHELL_CONFIG' or restart your terminal)"
    fi
fi

echo ""
echo "🚀 Installation Complete!"
echo "   Usage: tnf-copilot start  (starts the loop)"
echo "          tnf-copilot once   (single snapshot)"
echo ""
