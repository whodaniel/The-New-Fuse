#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension independently..."

# Navigate to chrome extension directory
cd chrome-extension

# Remove existing node_modules and build artifacts
rm -rf node_modules dist

# Install dependencies directly (without workspace)
npm install --legacy-peer-deps

# Run the build
npm run build
