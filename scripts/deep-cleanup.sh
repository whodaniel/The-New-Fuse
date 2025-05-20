#!/bin/bash
set -e

echo "🔍 Starting deep cleanup..."

# Remove all backup-related directories
echo "Removing backup directories..."
rm -rf ./cleanup-backups
rm -rf ./backups
rm -rf ./logs/final_consolidation_*

# Remove any remaining backup patterns
find . -type d \( \
    -name "backup*" -o \
    -name "*_backup*" -o \
    -name "final_consolidation_*" \
    \) -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm -rf {} +

echo "✅ Cleanup completed"

# Verify results
echo -e "\n🔍 Verifying cleanup..."
remaining_backups=$(find . -type d \( \
    -name "backup*" -o \
    -name "*_backup*" -o \
    -name "final_consolidation_*" \
    \) -not -path "*/node_modules/*" -not -path "*/.git/*")

if [ -n "$remaining_backups" ]; then
    echo "⚠️  Warning: Some backup directories still remain:"
    echo "$remaining_backups"
else
    echo "✅ No backup directories found"
fi

# Count remaining files
echo -e "\n📊 Current file count:"
find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/.git/*" | wc -l