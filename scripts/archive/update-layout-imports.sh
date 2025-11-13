#!/bin/bash

echo "Updating Layout component imports across the codebase..."

# Create logs directory
mkdir -p logs
LOG_FILE="logs/layout-import-updates-$(date +%Y%m%d%H%M%S).log"

# Function to update imports in a file
update_imports() {
  local file="$1"
  if [ -f "$file" ] && [[ "$file" != *"node_modules"* ]]; then
    # Check if file imports Layout from various packages
    if grep -q "import.*Layout.*from.*layout\|import.*Layout.*from.*ui-components" "$file"; then
      echo "Updating imports in $file"
      # Update the import to use consolidated components
      sed -i.bak "s|import.*Layout.*from.*layout.*|import { Layout } from '@the-new-fuse/ui-components/src/consolidated';|g" "$file"
      sed -i.bak "s|import.*Layout.*from.*ui-components.*|import { Layout } from '@the-new-fuse/ui-components/src/consolidated';|g" "$file"
      echo "Updated: $file" >> "$LOG_FILE"
    fi
  fi
}

# Process specific directories
process_directory() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "Processing directory: $dir"
    find "$dir" -name "*.tsx" -o -name "*.ts" | while read -r file; do
      update_imports "$file"
    done
  else
    echo "Directory not found: $dir"
  fi
}

# Process key directories
process_directory "apps/frontend/src"
process_directory "packages/features"
process_directory "src/components"

echo "Import updates complete! Check $LOG_FILE for details."

# Clean up backup files
find . -name "*.bak" -type f -delete
