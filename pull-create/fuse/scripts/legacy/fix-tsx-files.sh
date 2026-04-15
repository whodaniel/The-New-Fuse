#!/bin/bash

# Find all .tsx files that don't contain JSX syntax
find packages -name "*.tsx" -type f -exec grep -L "React\|JSX\|jsx\|<.*>\|render\|component" {} \; | while read file; do
  # Get the new filename with .ts extension
  new_file="${file%.tsx}.ts"
  
  # Rename the file
  echo "Renaming $file to $new_file"
  mv "$file" "$new_file"
  
  # Update imports in other files
  find packages -type f -name "*.ts*" -exec sed -i '' "s|${file%.tsx}\.tsx|${file%.tsx}\.ts|g" {} \;
done

echo "Finished renaming files"
