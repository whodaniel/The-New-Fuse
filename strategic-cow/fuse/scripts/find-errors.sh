#!/bin/bash

# Find all TypeScript files with syntax errors
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Check for missing property names in decorators
  if grep -q "@.*(.*):" "$file"; then
    echo "Error in $file: Missing property name in decorator"
    grep -n "@.*(.*):" "$file"
  fi
done
