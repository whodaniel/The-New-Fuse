#!/bin/bash

echo "Starting ts-node dependency fix..."

# Step 1: Clean up existing installation
echo "Step 1: Cleaning up existing installation..."
rm -rf node_modules
rm -f yarn.lock

# Step 2: Update package.json to use exact version for ts-node
echo "Step 2: Updating package.json with exact version for ts-node..."
# First, update the devDependencies section
sed -i '' 's/"ts-node": "\^10.9.3"/"ts-node": "10.9.3"/g' package.json
# Then, update the resolutions section
if grep -q '"ts-node":' package.json; then
  sed -i '' 's/"ts-node": "\^10.9.3"/"ts-node": "10.9.3"/g' package.json
else
  # Add ts-node to resolutions if it doesn't exist
  sed -i '' '/"typescript": "\^5.0.0"/a\
    "ts-node": "10.9.3",' package.json
fi

# Step 3: Install ts-node globally to ensure it's available
echo "Step 3: Installing ts-node globally..."
npm install -g ts-node@10.9.3

# Step 4: Try yarn install with increased network timeout
echo "Step 4: Running yarn install with increased network timeout..."
yarn install --network-timeout 100000

echo "Process completed. Check if the installation was successful."
