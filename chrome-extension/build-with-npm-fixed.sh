#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension directly with npm (modified approach)..."

# Navigate to chrome extension directory
cd "$(dirname "$0")"

# Create a temporary package.json with workspace: references replaced
echo "Creating temporary package.json without workspace references..."
sed 's/"workspace:\*"/"*"/g' package.json > package.json.npm

# Use the temporary package.json
echo "Installing dependencies with npm..."
npm install --no-save --package-lock=false --package-json=package.json.npm

# Build using the installed dependencies
echo "Building the extension..."
npm run build

# Clean up
echo "Cleaning up..."
rm package.json.npm

echo "Chrome extension build complete. Check the dist/ directory."
