#!/bin/bash

# Create Zsh completion directory if it doesn't exist
mkdir -p /usr/local/share/zsh/site-functions

# Regenerate Homebrew's completion scripts
brew completions link

# Set proper permissions
chmod -R go-w /usr/local/share