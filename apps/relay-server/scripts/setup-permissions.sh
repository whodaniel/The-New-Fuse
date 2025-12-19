#!/bin/bash
set -e

echo "🔧 Setting up script permissions..."

# Make all scripts executable
chmod +x scripts/*.sh
chmod +x scripts/**/*.sh  # For nested directories
chmod +x *.sh

echo "✅ Permissions set successfully!"
