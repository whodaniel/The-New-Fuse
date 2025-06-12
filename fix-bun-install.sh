#!/bin/bash

echo "Fixing bun installation issues..."

# Remove any existing yarn.lock file (if still present)
if [ -f yarn.lock ]; then
  echo "Removing existing yarn.lock file..."
  rm yarn.lock
fi

# Remove any existing bun.lockb file
if [ -f bun.lockb ]; then
  echo "Removing existing bun.lockb file..."
  rm bun.lockb
fi

# Remove node_modules directory
if [ -d node_modules ]; then
  echo "Removing node_modules directory..."
  rm -rf node_modules
fi

# Clear bun cache
echo "Clearing bun cache..."
bun pm cache clear

# Install ts-node globally with bun
echo "Installing ts-node globally with bun..."
bun install -g ts-node@10.9.3

# Try bun install again
echo "Running bun install..."
bun install

echo "Process completed."
