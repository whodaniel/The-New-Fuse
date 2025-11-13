#!/bin/bash

# Script to rename .tsx service files to .ts
# This will help fix TypeScript compilation errors

echo "Renaming service files from .tsx to .ts..."

# Directories to process
DIRECTORIES=("src/services" "apps/backend/src/services" "apps/api/src/services" "packages/core/src/services")

for DIR in "${DIRECTORIES[@]}"; do
  if [ -d "$DIR" ]; then
    echo "Processing directory: $DIR"
    
    # Find all .tsx files in the services directory (except React component files)
    # and rename them to .ts
    find "$DIR" -name "*.tsx" -type f | while read -r file; do
      # Skip files that actually contain JSX syntax (React components)
      if grep -q "React.Component\|import React\|from 'react'" "$file"; then
        echo "Skipping React component: $file"
      else
        new_file="${file%.tsx}.ts"
        echo "Renaming $file to $new_file"
        mv "$file" "$new_file"
      fi
    done

    # Find all declaration files with .d.tsx extension and rename to .d.ts
    find "$DIR" -name "*.d.tsx" -type f | while read -r file; do
      new_file="${file%.d.tsx}.d.ts"
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    done
  else
    echo "Directory not found: $DIR (skipping)"
  fi
done

echo "Renaming complete!"
