#!/bin/bash

echo "Installing specific version of bun..."

# Install bun if not already installed
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
fi

# Verify bun version
bun --version

echo "Now try running 'bun install' again."
