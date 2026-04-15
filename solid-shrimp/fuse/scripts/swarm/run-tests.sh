#!/bin/bash
# TNF Continuous Testing Runner
# This script ensures the correct environment is loaded before running tests

# Source NVM to get proper Node/PNPM paths
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the default node version
nvm use default 2>/dev/null || nvm use node 2>/dev/null

# Set PATH to include node and pnpm
export PATH="$(dirname $(which node)):$HOME/.local/share/pnpm:$PATH"

# Run the website testing agent
echo "🚀 Running TNF Website Testing Agent..."
node scripts/swarm/website-testing-agent.cjs "$@"
