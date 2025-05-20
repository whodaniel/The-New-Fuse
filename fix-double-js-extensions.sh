#!/bin/bash

# Find all TypeScript and JavaScript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | while read -r file; do
  # Replace .js.js with .js in import statements
  sed -i '' 's/\.js\.js/\.js/g' "$file"
  echo "Fixed $file"
done

echo "Completed fixing double .js.js extensions"
