#!/bin/bash
set -e

echo "Starting build process..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Generate icons first
echo "Generating icons..."
node generate-icons.cjs
node scripts/generate-notification-icons.cjs

# Ensure dependencies are installed
echo "Installing dependencies..."
yarn install --check-files

# Create dist directory if it doesn't exist
mkdir -p dist

# Build with webpack using the ES Module config file
echo "Building with webpack..."
NODE_OPTIONS="--experimental-json-modules" npx webpack --config webpack.config.mjs --mode production

echo "Build completed. Check dist/ directory."
ls -la dist/
