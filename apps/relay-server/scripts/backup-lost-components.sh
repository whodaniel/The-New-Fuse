#!/bin/bash

# Script to backup potentially lost components identified in the component analysis

# Create backup directory
BACKUP_DIR="cleanup-backups/potentially-lost"
mkdir -p "$BACKUP_DIR"

# Extract potentially lost components from the analysis log
grep "POTENTIALLY LOST:" component-analysis-log.txt | sed 's/POTENTIALLY LOST: \(.*\) (.*/\1/' > potentially-lost-components.txt

# Copy each file to the backup directory
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Create directory structure in backup
    dir_path="$BACKUP_DIR/$(dirname "$file")"
    mkdir -p "$dir_path"
    
    # Copy file to backup
    cp "$file" "$dir_path/"
    echo "Backed up: $file"
  else
    echo "File not found: $file"
  fi
done < potentially-lost-components.txt

echo "Backup complete. Files saved to $BACKUP_DIR"