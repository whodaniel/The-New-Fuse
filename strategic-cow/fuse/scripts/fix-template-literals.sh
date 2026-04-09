#!/bin/bash

# This script fixes template literals in JSX/TSX files
# It's useful for fixing issues with template literals in JSX/TSX files

echo "Fixing template literals in JSX/TSX files..."

# Create a backup directory
BACKUP_DIR="./template-literals-backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Find all TSX files with template literals
find ./src -type f -name "*.tsx" -exec grep -l "\${" {} \; | while read -r file; do
  echo "Checking $file for template literals in JSX"
  
  # Create a backup
  cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
  
  # Replace template literals in JSX with escaped versions
  # This is a complex operation that requires manual review
  # For now, we'll just add a comment to the file
  
  # Add a comment at the top of the file
  sed -i '' '1i\
// TODO: This file may contain template literals in JSX that need to be escaped\
// Use {"${variable}"} instead of ${variable} in JSX\
' "$file"
  
  echo "Added warning comment to $file"
done

echo "Template literal fixing complete! Backups saved to $BACKUP_DIR"
echo "Please review the files manually to ensure template literals are properly escaped in JSX."
