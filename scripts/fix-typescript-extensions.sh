#!/bin/bash

# Fix TypeScript file extensions in the types directory
# Changes .tsx files to .ts when they don't contain JSX syntax

TYPES_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src/types"
cd "$TYPES_DIR" || { echo "Failed to change to types directory"; exit 1; }

echo "Fixing TypeScript file extensions in: $TYPES_DIR"
echo "================================================"

# Function to check if a file contains JSX syntax (approximation)
contains_jsx() {
  grep -E '<[A-Za-z][A-Za-z0-9]*|<>|</>' "$1" >/dev/null 2>&1
}

# Counter for renamed files
renamed=0

# Handle regular .tsx files
for file in *.tsx; do
  # Skip if no matches or if it's a declaration file
  [[ "$file" == "*.tsx" || "$file" == *.d.tsx ]] && continue
  
  if [ -f "$file" ]; then
    if ! contains_jsx "$file"; then
      new_name="${file%.tsx}.ts"
      echo "Renaming: $file → $new_name"
      mv "$file" "$new_name"
      ((renamed++))
    else
      echo "Skipping (contains JSX): $file"
    fi
  fi
done

# Handle declaration .d.tsx files
for file in *.d.tsx; do
  # Skip if no matches
  [[ "$file" == "*.d.tsx" ]] && continue
  
  if [ -f "$file" ]; then
    if ! contains_jsx "$file"; then
      new_name="${file%.d.tsx}.d.ts"
      echo "Renaming: $file → $new_name"
      mv "$file" "$new_name"
      ((renamed++))
    else
      echo "Skipping (contains JSX): $file"
    fi
  fi
done

# Also check subdirectories if any exist
find . -type d | while read -r dir; do
  [[ "$dir" == "." ]] && continue
  
  echo "Checking directory: $dir"
  
  # Process .tsx files in subdirectory
  for file in "$dir"/*.tsx; do
    # Skip if no matches or if it's a declaration file
    [[ "$file" == "$dir/*.tsx" || "$file" == "$dir"/*.d.tsx ]] && continue
    
    if [ -f "$file" ]; then
      if ! contains_jsx "$file"; then
        new_name="${file%.tsx}.ts"
        echo "Renaming: $file → $new_name"
        mv "$file" "$new_name"
        ((renamed++))
      else
        echo "Skipping (contains JSX): $file"
      fi
    fi
  done
  
  # Process .d.tsx files in subdirectory
  for file in "$dir"/*.d.tsx; do
    # Skip if no matches
    [[ "$file" == "$dir/*.d.tsx" ]] && continue
    
    if [ -f "$file" ]; then
      if ! contains_jsx "$file"; then
        new_name="${file%.d.tsx}.d.ts"
        echo "Renaming: $file → $new_name"
        mv "$file" "$new_name"
        ((renamed++))
      else
        echo "Skipping (contains JSX): $file"
      fi
    fi
  done
done

echo "================================================"
echo "Total files renamed: $renamed"
echo "Done fixing TypeScript file extensions."