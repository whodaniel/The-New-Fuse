#!/bin/bash

echo "Starting TypeScript file conversion..."

# Create a log directory
mkdir -p logs
LOG_FILE="logs/tsx-conversion-$(date +%Y%m%d%H%M%S).log"

# Function to convert files with JSX syntax to .tsx
convert_jsx_files() {
  local search_path=$1
  local pattern=$2

  echo "Searching in $search_path for files with JSX syntax..."

  find "$search_path" -name "*.ts" -not -name "*.d.ts" | xargs grep -l "$pattern" 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
      new_file="${file%.ts}.tsx"
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
      echo "Converted: $file -> $new_file" >> "$LOG_FILE"
    fi
  done
}

# Convert files with JSX syntax in various directories
convert_jsx_files "apps/frontend/src" "<div\|<span\|<Link\|<Button\|React.FC\|className="

# Check for layout components
if [ -d "packages/layout" ]; then
  convert_jsx_files "packages/layout" "<div\|<span\|<Link\|<Button\|React.FC\|className="
fi

# Check for ui-components
if [ -d "packages/ui-components" ]; then
  convert_jsx_files "packages/ui-components/src" "<div\|<span\|<Link\|<Button\|React.FC\|className="
fi

# Check for src/layout directory
if [ -d "src/layout" ]; then
  convert_jsx_files "src/layout" "<div\|<span\|<Link\|<Button\|React.FC\|className="
fi

# Check for src/components directory
if [ -d "src/components" ]; then
  convert_jsx_files "src/components" "<div\|<span\|<Link\|<Button\|React.FC\|className="
fi

echo "Conversion complete! Check $LOG_FILE for details."
