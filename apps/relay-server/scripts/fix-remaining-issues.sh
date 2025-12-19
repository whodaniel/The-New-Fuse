#!/bin/bash

# Remove all .ts files that have corresponding .tsx files
for tsx_file in $(find src -name "*.tsx" -type f); do
  ts_file="${tsx_file%.tsx}.ts"
  
  if [ -f "$ts_file" ]; then
    echo "Removing $ts_file (replaced by $tsx_file)"
    rm "$ts_file"
  fi
done

echo "Done removing .ts files that have corresponding .tsx files."
