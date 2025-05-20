#!/bin/bash

# Development script for The New Fuse Chrome extension

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the extension in development mode
echo "Building extension in development mode..."
npx webpack --mode development --watch
