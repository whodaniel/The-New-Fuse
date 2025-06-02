#!/bin/bash
set -e

echo "Starting build process..."

# Using workspace root for consistent dependency resolution
cd "$(dirname "$0")/.."
echo "Working from workspace root: $(pwd)"

# Navigate to chrome extension directory
cd chrome-extension

# Generate icons first
echo "Generating icons..."
node generate-icons.cjs
node scripts/generate-notification-icons.cjs

# Ensure all dependencies are installed
echo "Checking dependencies..."
if ! yarn list html-webpack-plugin &> /dev/null; then
  echo "Missing html-webpack-plugin, installing it in workspace..."
  cd ..
  yarn add html-webpack-plugin -W --dev
  cd chrome-extension
fi

# Build with webpack using the ESM config
echo "Building with webpack..."
# Use the yarn script which is properly configured
yarn build

echo "Build completed. Check dist/ directory."
