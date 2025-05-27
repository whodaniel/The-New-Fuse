#!/bin/bash

# Enable error handling
set -e

echo "Building Chrome extension with isolated environment..."

# Create a temporary directory for the build
TEMP_DIR=$(mktemp -d)
echo "Created temporary build directory: $TEMP_DIR"

# Copy the chrome extension files to the temp directory
echo "Copying chrome extension files..."
cp -R chrome-extension/* $TEMP_DIR/

# Navigate to temp directory
cd $TEMP_DIR

# Clean any existing build artifacts
rm -rf node_modules dist

# Use npm package.json if available, otherwise clean up workspace references
if [ -f package.json.npm ]; then
  echo "Using prepared npm package.json file..."
  cp package.json.npm package.json
else
  echo "Removing workspace references from package.json..."
  # More aggressive workspace reference removal
  sed -i '' 's/"workspace:[^"]*"/"latest"/g' package.json
  # Also clean up any yarn workspace configurations
  sed -i '' '/"workspaces"/,/}/d' package.json
fi

# Create icon directory
echo "Creating icons directory..."
mkdir -p icons

# Install dependencies with yarn
echo "Installing dependencies with yarn..."
yarn install --frozen-lockfile

# Run the build
echo "Building extension..."
npm run build

# Copy the built files back to the original directory
echo "Copying built files back to chrome-extension directory..."
if [ -d dist ]; then
  mkdir -p /Users/<owner>/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/chrome-extension/dist
  cp -R dist/* /Users/<owner>/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/chrome-extension/dist/
  echo "Build complete and copied to chrome-extension/dist directory"
else
  echo "Error: Build failed - no dist directory created"
  exit 1
fi

echo "Build script finished. Check the chrome-extension/dist/ directory."
