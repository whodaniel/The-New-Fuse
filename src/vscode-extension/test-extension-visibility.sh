#!/bin/bash

# Test script to verify extension setup
echo "🔍 Testing The New Fuse Extension Setup..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/vscode-extension"

echo "📦 Checking package.json configuration..."
if grep -q "theNewFuse" package.json; then
    echo "✅ View containers found in package.json"
else
    echo "❌ View containers missing in package.json"
fi

echo "🔨 Compiling extension..."
npm run compile > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Extension compiles successfully"
else
    echo "❌ Compilation failed"
    exit 1
fi

echo "📁 Checking output files..."
if [ -f "out/extension.js" ]; then
    echo "✅ Extension output exists at out/extension.js"
else
    echo "❌ Extension output missing"
fi

echo "🚀 Starting VS Code Extension Development Host..."
code --extensionDevelopmentPath="$(pwd)" --new-window &

echo "✅ Extension Development Host launched!"
echo "📝 Look for 'The New Fuse' in the Activity Bar (sidebar) and Panel area"
echo "🔧 If extension is not visible, check Output panel > Extension Host for errors"
