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
    if grep -q "<div\|<span\|<Link\|className=\|React.FC\|<Button\|JSX\|React.Fragment\|<>\|</>\|<p\|<h1\|<h2\|<h3\|<ul\|<li\|<a\|<img\|<form\|<input\|<label\|<select\|<option\|<textarea\|<table\|<tr\|<td\|<th\|<thead\|<tbody\|<tfoot" "$file"; then
      new_file="${file%.ts}.tsx"
      echo "Converting $file to $new_file"
      mv "$file" "$new_file"
      echo "Converted: $file -> $new_file" >> "$LOG_FILE"
      
      # Add React import if missing
      if ! grep -q "import.*React" "$new_file"; then
        sed -i.bak '1i\
import React from "react";\
' "$new_file"
        rm -f "${new_file}.bak"
      fi
    fi
  fi
}

# Find all .ts files and convert them if they contain JSX
find_and_convert() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "Searching in $dir..."
    find "$dir" -type f -name "*.ts" | while read -r file; do
      convert_file "$file"
    done
  fi
}

# Process different directories
find_and_convert "src"
find_and_convert "packages"
find_and_convert "apps"

echo "Conversion complete! Check $LOG_FILE for details."
