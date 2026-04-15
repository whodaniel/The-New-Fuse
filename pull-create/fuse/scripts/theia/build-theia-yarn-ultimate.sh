#!/bin/bash

# Ultimate SkIDEancer Build Script (Yarn Edition)
# This script performs a full yarn install and then builds SkIDEancer and other packages.

set -e

echo "🚀 Starting the ULTIMATE SkIDEancer build process (Yarn Edition)..."

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
echo "Removing old node_modules and yarn.lock..."
rm -rf node_modules yarn.lock
rm -rf apps/ide-ide/node_modules
echo "Installing all dependencies (allowing scripts) with yarn..."
yarn install
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
if [ -d "node_modules/find-git-repositories" ]; then
    echo "Rebuilding find-git-repositories..."
    (cd node_modules/find-git-repositories && npx node-gyp rebuild)
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

# 4. Generate Drizzle Client
echo "
--- Step 4: Generating Drizzle Client ---"
yarn drizzle generate --schema packages/database/drizzle/schema.drizzle
echo "✅ Drizzle Client generated."

# 5. Build SkIDEancer IDE
echo "
--- Step 5: Building SkIDEancer IDE ---"
# Create the symlink to solve workspace issues
echo "Creating symlink for SkIDEancer's node_modules..."
ln -s ../../node_modules apps/ide-ide/node_modules

(cd apps/ide-ide && yarn ide build --mode production)
echo "✅ SkIDEancer IDE build complete."

# 6. Build the rest of the packages
echo "
--- Step 6: Building remaining project packages (excluding web-scraping) ---"
yarn turbo run build --filter="!@the-new-fuse/web-scraping" --concurrency=50

echo "
🎉🎉🎉 BUILD SUCCEEDED! 🎉🎉🎉"