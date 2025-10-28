#!/bin/bash

echo "Starting direct installation approach..."

# Step 1: Clean up existing installation
echo "Step 1: Cleaning up existing installation..."
rm -rf node_modules

# Step 2: Install ts-node directly with npm
echo "Step 2: Installing ts-node directly with npm..."
pnpm install ts-node@10.9.3 --save-dev

# Step 3: Try pnpm install for all dependencies
echo "Step 3: Installing all dependencies with npm..."
pnpm install

echo "Process completed. Check if the installation was successful."
