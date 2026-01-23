#!/bin/bash

# Ultimate SkIDEancer Build Script (v7)
# This script performs a full pnpm install and then builds SkIDEancer and other packages.

set -e

echo "🚀 Starting the ULTIMATE SkIDEancer build process (v3 - full install)..."

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
echo "Installing all dependencies (allowing scripts)..."
pnpm install
echo "✅ Clean install complete."

# 2. Generate Prisma Client
echo "
--- Step 2: Generating Prisma Client ---"
bun prisma generate --schema packages/database/prisma/schema.prisma
echo "✅ Prisma Client generated."

# 3. Build SkIDEancer IDE
echo "
--- Step 3: Building SkIDEancer IDE ---"
# Create the symlink to solve workspace issues
echo "Creating symlink for SkIDEancer's node_modules..."
ln -s ../../node_modules apps/ide-ide/node_modules

(cd apps/ide-ide && pnpm dlx @ide/cli@1.59.0 build --mode production)
echo "✅ SkIDEancer IDE build complete."

# 4. Build the rest of the packages
echo "
--- Step 4: Building remaining project packages (excluding web-scraping) ---"
turbo run build --filter="!@the-new-fuse/web-scraping" --concurrency=50

echo "
🎉🎉🎉 BUILD SUCCEEDED! 🎉🎉🎉"