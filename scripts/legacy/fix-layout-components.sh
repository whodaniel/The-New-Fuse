#!/bin/bash

echo "Starting conversion of layout components with TypeScript errors..."

# Create logs directory
mkdir -p logs
LOG_FILE="logs/layout-conversion-$(date +%Y%m%d%H%M%S).log"

# Function to convert a file from .ts to .tsx if it contains JSX
convert_file() {
  local file="$1"
  if [ -f "$file" ] && [[ "$file" != *"node_modules"* ]] && [[ "$file" != *".d.ts" ]]; then
    # Check if file contains JSX syntax
    if grep -q "<div\|<span\|<Link\|className=\|React.FC\|<Button\|<Header\|<Sidebar\|<Footer\|<main\|<header\|<footer" "$file"; then
      new_file="${file%.ts}.tsx"
      echo "Converting $file to $new_file"
      mv "$file" "$new_file"
      echo "Converted: $file -> $new_file" >> "$LOG_FILE"
      
      # Fix common TypeScript errors in the file
      sed -i.bak "s/React.FC</FC</g" "$new_file"
      sed -i.bak "s/: React.FC/: FC/g" "$new_file"
      sed -i.bak "s/React.useEffect/useEffect/g" "$new_file"
      sed -i.bak "s/React.useState/useState/g" "$new_file"
      sed -i.bak "s/React.useCallback/useCallback/g" "$new_file"
      sed -i.bak "s/React.useMemo/useMemo/g" "$new_file"
      sed -i.bak "s/: any/: unknown/g" "$new_file"
      sed -i.bak "s/as any/as unknown/g" "$new_file"
      
      echo "Fixed common TypeScript errors in $new_file" >> "$LOG_FILE"
    fi
  fi
}

# Process specific directories that are likely to contain layout components
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

# Process key layout directories
process_directory "packages/layout"
process_directory "packages/ui-components/src/layout"
process_directory "src/layout"
process_directory "apps/frontend/src/components/layout"

echo "Layout component conversion complete! Check $LOG_FILE for details."

# Clean up backup files
find . -name "*.bak" -type f -delete
