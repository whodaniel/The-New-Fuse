#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension with simple WebPack approach..."

# Navigate to chrome extension directory
cd "$(dirname "$0")"

# Create dist directory if it doesn't exist
mkdir -p dist
mkdir -p dist/icons

# Run webpack directly
echo "Running webpack build..."
./node_modules/.bin/webpack --mode production || npx webpack --mode production

# Copy static files
echo "Copying manifest and static files..."
cp manifest.json dist/
cp -r icons/*.png dist/icons/ || echo "No icons found to copy"

echo "Chrome extension build complete. Check the dist/ directory."
