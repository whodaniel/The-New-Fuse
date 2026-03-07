#!/bin/bash

set -e

echo "Setting up The New Fuse project..."

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
  echo "Yarn is not installed. Please install yarn first."
  exit 1
fi

# Install Yarn plugins
echo "Installing Yarn plugins..."
node scripts/install-yarn-plugins.js

# Install dependencies
echo "Installing dependencies..."
yarn install

# Fix path aliases in source files
echo "Fixing path aliases in source files..."
node scripts/fix-path-aliases.js

# Ensure packages directory exists
mkdir -p packages/types/src
mkdir -p packages/core/src
mkdir -p packages/hooks/src

# Create necessary package files if they don't exist
if [ ! -f "packages/types/package.json" ]; then
  echo "Creating types package.json..."
  echo '{
  "name": "@the-new-fuse/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  }
}' > packages/types/package.json
fi

# Build packages in correct order
echo "Building packages in correct order..."
# Use direct TypeScript calls instead of relying on Yarn workspaces initially
node_modules/.bin/tsc -p packages/types/tsconfig.json
node_modules/.bin/tsc -p packages/core/tsconfig.json
node_modules/.bin/tsc -p packages/hooks/tsconfig.json

# Run type checks
echo "Running type checks..."
node scripts/run-tsc.js

echo "Setup complete! You can now run 'yarn dev' to start the development server."
