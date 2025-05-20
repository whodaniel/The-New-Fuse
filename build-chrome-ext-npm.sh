#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension with npm..."

# Navigate to chrome extension directory
cd "$(dirname "$0")/chrome-extension"

# Remove existing node_modules and build artifacts
rm -rf node_modules dist

# Install dependencies with npm
npm install

# Build the extension
npm run build

echo "Chrome extension build complete. Check the dist/ directory."
