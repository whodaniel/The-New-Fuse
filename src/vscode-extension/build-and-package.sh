#!/bin/bash

# Build and Package Script for The New Fuse VS Code Extension
# This script compiles the TypeScript code and packages the extension as a .vsix file

echo "===================================================="
echo "  The New Fuse - Build and Package Script"
echo "===================================================="
echo ""

# Create necessary directories
mkdir -p dist
mkdir -p out

# Check if TypeScript compiler is available
if ! command -v tsc &> /dev/null; then
    echo "TypeScript compiler not found. Installing TypeScript..."
    npm install -g typescript
fi

# Check if vsce is available
if ! command -v vsce &> /dev/null; then
    echo "vsce not found. Installing vsce..."
    npm install -g @vscode/vsce
fi

# Install dependencies
echo "Installing dependencies..."
yarn install

# Compile TypeScript to JavaScript
echo "Compiling TypeScript..."
tsc -p tsconfig.json

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ TypeScript compilation completed successfully!"

# Copy necessary files to dist directory
echo "Copying files to dist directory..."
cp -r out/* dist/
cp package.json dist/
cp README.md dist/
cp -r resources dist/
cp -r web-ui dist/

# Package the extension
echo "Packaging the extension..."
vsce package --no-dependencies

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed. Please check the errors above."
    exit 1
fi

echo "✅ Extension packaged successfully!"
echo "You can find the .vsix file in the current directory."
echo ""
echo "To install the extension, run:"
echo "code --install-extension the-new-fuse-vscode-*.vsix"
echo ""
echo "===================================================="
