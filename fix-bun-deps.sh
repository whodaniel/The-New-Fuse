#!/bin/bash

echo "Fixing bun dependency issues..."

# Create a temporary package.json with just the ts-node dependency
echo '{
  "name": "temp-ts-node-installer",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "ts-node": "10.9.3"
  }
}' > temp-package.json

# Install ts-node using bun in a temporary directory
mkdir -p temp-install
cp temp-package.json temp-install/package.json
cd temp-install
bun install
cd ..

# Copy the installed ts-node to the project's node_modules
mkdir -p node_modules
cp -r temp-install/node_modules/ts-node node_modules/

# Clean up
rm -rf temp-install temp-package.json

# Try bun install again
echo "Running bun install..."
bun install

echo "Process completed."
