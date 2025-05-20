#!/bin/bash

# Find all TypeScript and JavaScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | while read -r file; do
  # Add .js extension to import statements that are missing them
  # This regex looks for import statements with relative paths that don't have a file extension
  # But avoid adding .js to imports that already have a file extension
  sed -i '' -E "s/from ['\"](\.\.[^'\"\.]*|\.\/[^'\"\.]*)['\"]([^;]*)/from '\1.js'\2/g" "$file"
  echo "Fixed $file"
done

echo "Completed adding missing .js extensions"
