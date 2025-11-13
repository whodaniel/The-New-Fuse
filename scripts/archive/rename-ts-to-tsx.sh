#!/bin/bash

# Focus on the packages/ui-components directory first since that's where we saw errors
find ./packages/ui-components -name "*.ts" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -exec grep -l "<.*>" {} \; | grep -v ".d.ts" | while read -r file; do
  # Skip files that already have a .tsx counterpart
  tsx_file="${file%.ts}.tsx"
  if [ ! -f "$tsx_file" ]; then
    # Rename the file
    mv "$file" "$tsx_file"
    echo "Renamed $file to $tsx_file"
  else
    echo "Skipping $file as $tsx_file already exists"
  fi
done

echo "Completed renaming .ts files to .tsx in packages/ui-components"
