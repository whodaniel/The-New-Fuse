#!/bin/bash

echo "Using npm instead of yarn..."

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

# Install dependencies with npm
echo "Installing dependencies with npm..."
npm install

echo "Process completed."
