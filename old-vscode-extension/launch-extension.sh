#!/bin/bash

# Enhanced launch script for The New Fuse VSCode Extension
# This script properly organizes, compiles, and launches the extension

echo "🚀 Preparing The New Fuse VS Code Extension..."

# Ensure we have the correct VS Code path
VSCODE="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
if [ ! -f "$VSCODE" ]; then
  VSCODE="code" # Try using the PATH version if the direct path doesn't exist
fi

# Set directories
EXTENSION_DIR="$(pwd)"
SRC_DIR="$EXTENSION_DIR/src"
OUT_DIR="$EXTENSION_DIR/out"

# Create necessary directories
mkdir -p "$SRC_DIR/chat"
mkdir -p "$SRC_DIR/views"

echo "📁 Ensuring correct file structure..."

# Fix import in the settings view provider file
if [ -f "$SRC_DIR/views/settings-view-provider.ts" ]; then
  # Add vscode import if missing
  if ! grep -q "import \* as vscode from 'vscode';" "$SRC_DIR/views/settings-view-provider.ts"; then
    sed -i '' '1s/^/import * as vscode from '\''vscode'\'';\n/' "$SRC_DIR/views/settings-view-provider.ts"
  fi
  echo "✅ Settings view provider is ready"
fi

# Check if tsconfig.json is set correctly
if [ -f "$EXTENSION_DIR/tsconfig.json" ]; then
  echo "📝 Ensuring TypeScript configuration is correct..."
  # Update rootDir in tsconfig.json if needed
  if grep -q '"rootDir": "src"' "$EXTENSION_DIR/tsconfig.json"; then
    echo "⚙️ Updating TypeScript configuration for our file structure..."
    sed -i '' 's/"rootDir": "src"/"rootDir": "."/' "$EXTENSION_DIR/tsconfig.json"
  fi
  # Make sure include has both src and root TS files
  if ! grep -q '"include": \["src/\*\*/\*", "\*.ts"\]' "$EXTENSION_DIR/tsconfig.json"; then
    sed -i '' 's/"include": \["src\/\*\*\/\*"\]/"include": \["src\/\*\*\/\*", "\*.ts"\]/' "$EXTENSION_DIR/tsconfig.json"
  fi
fi

# Compile the extension
echo "🔨 Compiling the extension..."
npx tsc

# Check if compilation was successful
if [ $? -eq 0 ]; then
  echo "✅ Compilation successful!"
else
  echo "❌ Compilation failed. Please check the errors above."
  exit 1
fi

# Launch VS Code with the extension
echo "🚀 Launching VS Code with The New Fuse Extension..."
"$VSCODE" --extensionDevelopmentPath="$EXTENSION_DIR" "$@"

echo "Extension development session started."