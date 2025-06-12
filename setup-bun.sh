#!/bin/bash

# Enable error handling
set -e

echo "Setting up Bun..."

# Install bun if not already installed
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Clean cache and node_modules
rm -rf .yarn/cache .yarn/install-state.gz node_modules chrome-extension/node_modules .yarn/build-state.yml

# Install dependencies
bun install

# Build chrome extension
cd chrome-extension
bun install
bun run build
