#!/bin/bash

# Ultimate SkIDEancer Build Script (v5)
# Manually orchestrates the entire SkIDEancer build process, including all known problematic native modules.

set -e

echo "🚀 Starting the ULTIMATE SkIDEancer build process..."

# 0. Set Node.js version
echo "
--- Step 0: Setting Node.js version ---"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
if [[ ! "$(node --version)" =~ ^v18\. ]]; then
    echo "Switching to Node.js 18..."
    nvm use 18
else
    echo "Already using Node.js 18."
fi

# 1. Clean Installation
echo "
--- Step 1: Performing clean install ---"
echo "Removing old node_modules and bun.lockb..."
rm -rf node_modules bun.lockb
rm -rf apps/ide-ide/node_modules
echo "Installing all dependencies but ignoring their scripts..."
pnpm install --ignore-scripts
echo "✅ Clean install complete."

# 2. Manually Rebuild ALL Native Modules
echo "
--- Step 2: Manually rebuilding all known native modules ---"
if [ -d "node_modules/canvas" ]; then
    echo "Rebuilding canvas..."
    (cd node_modules/canvas && npx node-gyp rebuild)
fi
if [ -d "node_modules/drivelist" ]; then
    echo "Rebuilding drivelist..."
    (cd node_modules/drivelist && npx node-gyp rebuild)
fi
if [ -d "node_modules/node-pty" ]; then
    echo "Rebuilding node-pty..."
    (cd node_modules/node-pty && npx node-gyp rebuild)
fi
echo "✅ Native modules rebuilt."

# 3. Manually Run Ripgrep Download
echo "
--- Step 3: Manually downloading ripgrep ---"
if [ -d "node_modules/@vscode/ripgrep" ]; then
    echo "Fetching ripgrep binary..."
    (cd node_modules/@vscode/ripgrep && node ./lib/postinstall.js)
else
    echo "ERROR: @vscode/ripgrep not found!"
    exit 1
fi
echo "✅ Ripgrep is ready."

# 4. Build SkIDEancer IDE
echo "
--- Step 4: Building SkIDEancer IDE ---"
# Create the symlink to solve workspace issues
echo "Creating symlink for SkIDEancer's node_modules..."
ln -s ../../node_modules apps/ide-ide/node_modules

(cd apps/ide-ide && pnpm dlx @ide/cli@1.59.0 build --mode production)
echo "✅ SkIDEancer IDE build complete."

# 5. Build the rest of the packages
echo "
--- Step 5: Building remaining project packages ---"
pnpm run build:packages

echo "
🎉🎉🎉 BUILD SUCCEEDED! 🎉🎉🎉"
