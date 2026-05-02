#!/bin/bash

# Script to rename .js files with JSX syntax to .jsx files
# and update imports accordingly

echo "Starting to fix JSX files with incorrect extensions..."

# Find files with JSX syntax that have .js extension
find_jsx_files() {
  find . -type f -name "*.js" | xargs grep -l "jsx_runtime" | grep -v "node_modules"
}

# Step 1: Rename files from .js to .jsx
rename_files() {
  local files=$(find_jsx_files)
  for file in $files; do
    if [ -f "$file" ]; then
      dir=$(dirname "$file")
      base=$(basename "$file" .js)
      new_file="${dir}/${base}.jsx"
      echo "Renaming: $file -> $new_file"
      mv "$file" "$new_file"
      
      # If this is an index.js file, update any imports that might reference it
      if [ "$base" == "index" ]; then
        grep -r "from '${dir}'" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" > /tmp/imports_to_fix.txt
        while read -r import_line; do
          import_file=$(echo "$import_line" | cut -d':' -f1)
          echo "Updating imports in $import_file"
          sed -i '' "s|from '${dir}'|from '${dir}/index.jsx'|g" "$import_file"
          sed -i '' "s|from \"${dir}\"|from \"${dir}/index.jsx\"|g" "$import_file"
        done < /tmp/imports_to_fix.txt
      fi
    fi
  done
}

# Step 2: Fix any imports that might be broken
fix_imports() {
  local renamed_files=$(find . -type f -name "*.jsx" | grep -v "node_modules")
  for file in $renamed_files; do
    base_no_ext=$(basename "$file" .jsx)
    dir=$(dirname "$file")
    
    # Find any files that import this file with .js extension
    grep -r "from '${dir}/${base_no_ext}.js'" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" > /tmp/direct_imports_to_fix.txt
    while read -r import_line; do
      import_file=$(echo "$import_line" | cut -d':' -f1)
      echo "Updating direct import in $import_file"
      sed -i '' "s|from '${dir}/${base_no_ext}.js'|from '${dir}/${base_no_ext}.jsx'|g" "$import_file"
    done < /tmp/direct_imports_to_fix.txt
  done
}

# Execute the script
rename_files
fix_imports

echo "Completed fixing JSX files!"