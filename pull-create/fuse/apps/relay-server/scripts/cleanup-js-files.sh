#!/bin/bash

# This script removes compiled JavaScript files from source directories
# It should be run before building the project

echo "Cleaning up compiled JavaScript files from source directories..."

# Remove .js files that have corresponding .ts files in the src directory
find ./src -type f -name "*.ts" | while read -r ts_file; do
  js_file="${ts_file%.ts}.js"
  if [ -f "$js_file" ]; then
    echo "Removing $js_file"
    rm "$js_file"
  fi
done

# Remove .js files that have corresponding .tsx files in the src directory
find ./src -type f -name "*.tsx" | while read -r tsx_file; do
  js_file="${tsx_file%.tsx}.js"
  if [ -f "$js_file" ]; then
    echo "Removing $js_file"
    rm "$js_file"
  fi
done

# Remove .d.ts.js files (these should never exist)
find ./src -type f -name "*.d.ts.js" | while read -r file; do
  echo "Removing $file"
  rm "$file"
done

echo "Cleanup complete!"
