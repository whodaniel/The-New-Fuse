#!/bin/bash
# Script to remove CommonJS artifacts from TypeScript source files

cd src

# Find all .ts and .tsx files that contain CommonJS exports
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "^exports\." {} \;)

echo "Found $(echo "$FILES" | wc -l) files with CommonJS exports"
echo "These files appear to be compiled JavaScript in .ts files"
echo ""
echo "Removing these corrupted files (they should be regenerated from source):"

for file in $FILES; do
  echo "  - $file"
  rm "$file"
done

echo ""
echo "Done! Files removed: $(echo "$FILES" | wc -l)"
