#!/bin/bash

echo "Starting conversion of .ts files with JSX to .tsx..."

# Create logs directory
mkdir -p logs
LOG_FILE="logs/jsx-conversion-$(date +%Y%m%d%H%M%S).log"

# Function to convert a file from .ts to .tsx if it contains JSX
convert_file() {
  local file="$1"
  if [ -f "$file" ] && [[ "$file" != *"node_modules"* ]] && [[ "$file" != *".d.ts" ]]; then
    # Check if file contains JSX syntax
    if grep -q "<div\|<span\|<Link\|className=\|React.FC\|<Button" "$file"; then
      new_file="${file%.ts}.tsx"
      echo "Converting $file to $new_file"
      mv "$file" "$new_file"
      echo "Converted: $file -> $new_file" >> "$LOG_FILE"
    fi
  fi
}

# Process specific directories that are likely to contain React components
process_directory() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "Processing directory: $dir"
    find "$dir" -name "*.ts" | while read -r file; do
      convert_file "$file"
    done
  else
    echo "Directory not found: $dir"
  fi
}

# Process key directories
process_directory "packages/features"
process_directory "packages/layout"
process_directory "src/components"
process_directory "packages/ui-components/src/layout"
process_directory "packages/ui-components/src/core"
process_directory "apps/frontend/src/components"

echo "Conversion complete! Check $LOG_FILE for details."
