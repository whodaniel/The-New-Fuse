#!/bin/bash

echo "Fixing pnpm installation issues..."

# Remove any existing yarn.lock file (if still present)
if [ -f yarn.lock ]; then
  echo "Removing existing yarn.lock file..."
  rm yarn.lock
fi

# Remove node_modules directory
if [ -d node_modules ]; then
  echo "Removing node_modules directory..."
  rm -rf node_modules
fi

# Clear pnpm store
echo "Clearing pnpm store..."
pnpm store prune

# Install ts-node globally with pnpm
echo "Installing ts-node globally with pnpm..."
pnpm install -g ts-node@10.9.3

# Try pnpm install again
echo "Running pnpm install..."
pnpm install

echo "Process completed."
