#!/bin/bash

# This script builds the project incrementally, only recompiling files that have changed
# It uses the TypeScript project references feature to ensure correct build order

# Clean up compiled JavaScript files from source directories
echo "Cleaning up compiled JavaScript files from source directories..."
bash ./scripts/cleanup-js-files.sh

# Build the project incrementally
echo "Building the project incrementally..."
tsc -b --incremental

# Check for errors
if [ $? -eq 0 ]; then
  echo "Build successful!"
else
  echo "Build failed with errors."
  exit 1
fi
