#!/bin/bash

echo "Fixing ts-node dependency directly..."

# Create a temporary directory
mkdir -p temp-fix

# Create a package.json file in the temporary directory
cat > temp-fix/package.json << EOF
{
  "name": "temp-fix",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "ts-node": "10.9.3"
  }
}
EOF

# Install ts-node in the temporary directory
cd temp-fix
npm install
cd ..

# Create the node_modules directory if it doesn't exist
mkdir -p node_modules

# Copy the ts-node module from the temporary directory
cp -r temp-fix/node_modules/ts-node node_modules/

# Copy any dependencies of ts-node
cp -r temp-fix/node_modules/@* node_modules/ 2>/dev/null || true

# Clean up
rm -rf temp-fix

echo "ts-node has been installed directly. Now try running 'yarn install' again."
