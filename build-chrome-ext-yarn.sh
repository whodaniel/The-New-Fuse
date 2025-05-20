#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension..."

# Navigate to chrome extension directory
cd "$(dirname "$0")/chrome-extension"

# Remove existing node_modules and build artifacts
rm -rf node_modules dist

# Install dependencies with yarn
yarn install

# Generate icons and build
yarn generate-icons
yarn generate-notification-icons
yarn build

echo "Chrome extension build complete. Check the dist/ directory."
