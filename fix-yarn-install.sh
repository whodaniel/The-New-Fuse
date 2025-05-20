#!/bin/bash

echo "Fixing yarn installation issues..."

# Remove any existing yarn.lock file
if [ -f yarn.lock ]; then
  echo "Removing existing yarn.lock file..."
  rm yarn.lock
fi

# Remove node_modules directory
if [ -d node_modules ]; then
  echo "Removing node_modules directory..."
  rm -rf node_modules
fi

# Clear yarn cache
echo "Clearing yarn cache..."
yarn cache clean

# Install ts-node globally with npm
echo "Installing ts-node globally with npm..."
npm install -g ts-node@10.9.3

# Try yarn install again
echo "Running yarn install..."
yarn install

echo "Process completed."
