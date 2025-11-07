#!/bin/bash

echo "Fixing Zsh configuration issues..."

# Remove all .zcompdump files
echo "Removing .zcompdump files..."
rm -f ~/.zcompdump*

# Backup the original .zshrc
echo "Backing up original .zshrc..."
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d%H%M%S)

# Copy the fixed .zshrc
echo "Installing fixed .zshrc..."
cp ./fixed_zshrc.txt ~/.zshrc

echo "Fix complete! Please restart your terminal or run 'source ~/.zshrc'"
