#!/bin/bash

set -e

echo "Setting up The New Fuse project..."

# Check if yarn is installed
if ! command -v pnpm &> /dev/null; then
  echo "pnpm is not installed. Please install pnpm first."
  exit 1
fi

# Install Yarn plugins
echo "Installing Yarn plugins..."
node scripts/install-yarn-plugins.js

# Install dependencies
echo "Installing dependencies..."
pnpm install

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
pnpm turbo run build --filter=@the-new-fuse/types --filter=@the-new-fuse/core --filter=@the-new-fuse/hooks

# Run type checks
echo "Running type checks..."
pnpm turbo run type-check

echo "Setup complete! You can now run 'pnpm run dev' to start the development server."
