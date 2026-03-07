#!/bin/bash
set -e

echo "🧹 Removing unnecessary backup directories..."

# List of backup patterns to remove
BACKUP_PATTERNS=(
    "backups/"
    "cleanup-backups/"
    "*_backup_*/"
    "*_backup/"
    "final_consolidation_*/"
    "**/backup*/"
)

# First, verify what will be deleted
echo "The following backup directories will be removed:"
for pattern in "${BACKUP_PATTERNS[@]}"; do
    find . -type d -name "$pattern" ! -path "*/node_modules/*" ! -path "*/.git/*"
done

# Prompt for confirmation
read -p "Are you sure you want to remove these directories? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Remove the directories
    for pattern in "${BACKUP_PATTERNS[@]}"; do
        find . -type d -name "$pattern" ! -path "*/node_modules/*" ! -path "*/.git/*" -exec rm -rf {} +
    done
    
    echo "✅ Backup directories removed successfully"
    echo "💡 Remember: Use Git for version control and history:"
    echo "    - git log : to view history"
    echo "    - git checkout <commit> : to view previous versions"
    echo "    - git revert <commit> : to undo changes"
else
    echo "Operation cancelled"
fi