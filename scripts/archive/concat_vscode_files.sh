#!/bin/bash

# Output file
OUTPUT_FILE="vscode_extension_all_code.txt"

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Find all files in the vscode-extension directory, excluding node_modules
find ./src/vscode-extension -type f -not -path "*/node_modules/*" -not -path "*/out/*" | sort | while read -r file; do
  # Skip binary files and large generated files
  if [[ "$file" == *.png || "$file" == *.jpg || "$file" == *.ico || "$file" == *.vsix || "$file" == *.gif || "$file" == *package-lock.json ]]; then
    continue
  fi
  
  # Add a header for the file
  echo -e "\n\n\n==============================================" >> "$OUTPUT_FILE"
  echo -e "FILE: $file" >> "$OUTPUT_FILE"
  echo -e "==============================================\n" >> "$OUTPUT_FILE"
  
  # Add the file content
  cat "$file" >> "$OUTPUT_FILE"
done

echo "All files have been concatenated to $OUTPUT_FILE"
