#!/bin/bash

# Find all .ts files that have corresponding .tsx files
for tsx_file in $(find src -name "*.tsx" -type f); do
  ts_file="${tsx_file%.tsx}.ts"
  
  if [ -f "$ts_file" ]; then
    echo "Updating imports in $ts_file to point to $tsx_file"
    
    # Create a new file with updated imports
    echo "export * from '${tsx_file%.ts}';" > "${ts_file}.new"
    
    # Replace the original file
    mv "${ts_file}.new" "$ts_file"
  fi
done

echo "Done updating imports."
