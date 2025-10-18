#!/bin/bash

echo "Fixing ppnpm installation issues..."

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

# Clear ppnpm store
echo "Clearing ppnpm store..."
pnpm store prune

# Install ts-node globally with pnpm
echo "Installing ts-node globally with pnpm..."
ppnpm install -g ts-node@10.9.3

# Try ppnpm install again
echo "Running ppnpm install..."
ppnpm install

echo "Process completed."
