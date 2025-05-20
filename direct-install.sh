#!/bin/bash

echo "Starting direct installation approach..."

# Step 1: Clean up existing installation
echo "Step 1: Cleaning up existing installation..."
rm -rf node_modules
rm -f yarn.lock

# Step 2: Install ts-node directly with npm
echo "Step 2: Installing ts-node directly with npm..."
npm install ts-node@10.9.3 --save-dev

# Step 3: Try npm install for all dependencies
echo "Step 3: Installing all dependencies with npm..."
npm install

echo "Process completed. Check if the installation was successful."
