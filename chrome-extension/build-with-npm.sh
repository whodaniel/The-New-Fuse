#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension directly with npm..."

# Remove existing node_modules and build artifacts
rm -rf node_modules dist

# Install dependencies with npm
npm install

# Build the extension
npm run build

echo "Chrome extension build complete. Check the dist/ directory."
