#!/bin/bash

echo "Starting comprehensive fix for dependency issues..."

# Step 1: Clean up existing installation
echo "Step 1: Cleaning up existing installation..."
rm -rf node_modules
rm -f yarn.lock
rm -f package-lock.json

# Step 2: Update package.json to use exact version for ts-node
echo "Step 2: Updating package.json to use exact version for ts-node..."
sed -i '' 's/"ts-node": "\^10.9.3"/"ts-node": "10.9.3"/g' package.json

# Step 3: Install ts-node globally
echo "Step 3: Installing ts-node globally..."
pnpm install -g ts-node@10.9.3

# Step 4: Try pnpm install first
echo "Step 4: Running pnpm install..."
pnpm install

# Step 5: Try bun install
echo "Step 5: Running bun install..."
bun install

echo "Process completed. Check if the installation was successful."
