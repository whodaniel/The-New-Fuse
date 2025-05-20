#!/bin/bash

# Build script for The New Fuse VS Code Extension
# This script ensures proper file structure and compilation

echo "🚀 Building The New Fuse VS Code Extension..."

# Create necessary directories
mkdir -p ./src/chat
mkdir -p ./src/views

# Check if the chat interface file exists in the root directory
if [ -f "./src/chat/chat-interface.ts" ]; then
  echo "✅ Chat interface source file already in correct location"
else
  # If not in src directory, create it from the root file or create a placeholder
  if [ -f "./chat-interface.ts" ]; then
    echo "📋 Moving chat-interface.ts to src/chat directory..."
    cp ./chat-interface.ts ./src/chat/
  else
    echo "⚠️ Chat interface source file not found, will use existing implementation"
  fi
fi

# Move the settings view provider if needed
if [ -f "./src/views/settings-view-provider.ts" ]; then
  echo "✅ Settings view provider already in correct location"
else
  if [ -f "./src/views/settings-view-provider.ts" ]; then
    echo "Settings view provider found in the correct location"
  else
    echo "⚠️ Settings view provider not found in expected location, creating directory structure..."
    mkdir -p ./src/views
  fi
fi

# Update rootDir in tsconfig.json to "." (root) to include all TypeScript files
TSCONFIG_PATH="./tsconfig.json"
if [ -f "$TSCONFIG_PATH" ]; then
  echo "📝 Updating TypeScript configuration..."
  # Replace "rootDir": "src" with "rootDir": "." to include TS files from root
  sed -i '' 's/"rootDir": "src"/"rootDir": "."/' "$TSCONFIG_PATH"
  # Update include to include both src and root TS files
  sed -i '' 's/"include": \["src\/\*\*\/\*"\]/"include": \["src\/\*\*\/\*", "\*.ts"\]/' "$TSCONFIG_PATH"
  echo "✅ TypeScript configuration updated"
else
  echo "❌ tsconfig.json not found, please check your setup"
  exit 1
fi

# Run the TypeScript compiler
echo "🔨 Compiling TypeScript..."
npx tsc

# Check if compilation was successful
if [ $? -eq 0 ]; then
  echo "✅ Compilation successful!"
else
  echo "❌ Compilation failed. Please check the errors above."
  exit 1
fi

# Check if the out directory has the compiled files
if [ -d "./out" ]; then
  echo "📦 Compiled files generated in the 'out' directory"
else
  echo "❌ 'out' directory not found. Compilation may have failed."
  exit 1
fi

# Package the extension (if vsce is installed)
if command -v vsce &> /dev/null; then
  echo "📦 Packaging the extension..."
  vsce package
  
  if [ $? -eq 0 ]; then
    echo "✅ Extension packaged successfully!"
    echo "🎉 You can now install the VSIX file in VS Code"
  else
    echo "❌ Packaging failed. You may need to fix package.json or other issues."
  fi
else
  echo "⚠️ vsce not found. To package the extension, install it with:"
  echo "npm install -g @vscode/vsce"
  echo "Then run 'vsce package' in this directory."
fi

echo "🏁 Build process completed!"