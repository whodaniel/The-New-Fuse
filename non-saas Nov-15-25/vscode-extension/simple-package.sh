#!/bin/bash

cd '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension'

echo "Creating .vsix package manually..."

# Create a temporary working directory
TEMP_DIR="vsix-temp-$$"
mkdir -p "$TEMP_DIR"

# Copy essential files
echo "Copying package.json..."
cp package.json "$TEMP_DIR/"

echo "Copying dist directory..."
cp -r dist "$TEMP_DIR/"

# Copy optional files if they exist
if [ -f "README.md" ]; then
    echo "Copying README.md..."
    cp README.md "$TEMP_DIR/"
fi

if [ -f "CHANGELOG.md" ]; then
    echo "Copying CHANGELOG.md..."
    cp CHANGELOG.md "$TEMP_DIR/"
fi

if [ -d "media" ]; then
    echo "Copying media directory..."
    cp -r media "$TEMP_DIR/"
fi

# Create the .vsix file (which is a zip file)
echo "Creating .vsix archive..."
cd "$TEMP_DIR"
zip -r "../the-new-fuse.vsix" .
cd ..

# Clean up
rm -rf "$TEMP_DIR"

# Check if file was created
if [ -f "the-new-fuse.vsix" ]; then
    echo "SUCCESS: Package created: the-new-fuse.vsix"
    ls -lh the-new-fuse.vsix
    echo ""
    echo "To install:"
    echo "  code --install-extension the-new-fuse.vsix"
    echo ""
    echo "Or use VS Code UI:"
    echo "  1. Open VS Code"
    echo "  2. Ctrl+Shift+P (or Cmd+Shift+P)"
    echo "  3. Type 'Extensions: Install from VSIX...'"
    echo "  4. Select the-new-fuse.vsix"
else
    echo "ERROR: Failed to create package"
    exit 1
fi
