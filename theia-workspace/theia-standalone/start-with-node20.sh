#!/bin/bash

# Ensure we're using Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🔄 Switching to Node 20..."
nvm use 20

echo "✅ Current Node version:"
node -v

echo ""
echo "🚀 Starting Theia IDE Enhanced Server..."
node enhanced-server.js
