#!/bin/bash

set -e

VSCODE_EXT_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"
cd "$VSCODE_EXT_DIR"

echo "🚀 Creating a new version of The New Fuse VS Code Extension..."

# --- 1. Increment version number ---
echo "Bumping package version..."

# Use Node.js to read, increment the patch version, and write it back.
# This avoids dependencies on tools like jq or sed.
node -e "
const fs = require('fs');
const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
const parts = pkg.version.split('.');
parts[2] = parseInt(parts[2], 10) + 1;
pkg.version = parts.join('.');
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
console.log(\`Version bumped to: \${pkg.version}\`);
"

if [ $? -ne 0 ]; then
    echo "❌ Failed to increment version in package.json"
    exit 1
fi

# --- 2. Install dependencies ---
echo "Installing dependencies with bun..."
bun install

# --- 3. Compile the extension ---
echo "Compiling TypeScript..."
bun run compile # Assumes 'compile' script exists in package.json for tsc

# --- 4. Package the extension ---
echo "Packaging .vsix file..."
bun run package # Assumes 'package' script exists for 'vsce package'

echo ""
echo "✅ Success! New .vsix package created."
echo "--------------------------------------------------"
echo "Newly packaged extension file:"
ls -lhtr *.vsix | tail -n 1
echo "--------------------------------------------------"