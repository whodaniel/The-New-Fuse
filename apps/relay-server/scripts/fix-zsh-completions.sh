#!/bin/bash

# Create the directory structure
sudo mkdir -p /usr/local/share/zsh/site-functions

# Generate Homebrew completions
brew completions link

# Set proper permissions
sudo chmod -R 755 /usr/local/share/zsh
sudo chown -R $(whoami):admin /usr/local/share/zsh