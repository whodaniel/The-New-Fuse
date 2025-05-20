#!/bin/bash

echo "Fixing ts-node dependency issue..."

# Install ts-node globally
npm install -g ts-node@10.9.3

# Install ts-node locally
npm install --save-dev ts-node@10.9.3

# Check if ts-node is installed
echo "Checking ts-node installation..."
npx ts-node --version || echo "ts-node installation failed"

# Try yarn install again
echo "Running yarn install..."
yarn install

echo "Process completed."
