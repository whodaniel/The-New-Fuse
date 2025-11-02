#!/bin/bash

# SAFE Emergency syntax cleanup script for The New Fuse project
# This script creates backups and provides dry-run options

set -e  # Exit on any error

BACKUP_DIR="./syntax-backup-$(date +%Y%m%d-%H%M%S)"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--dry-run] [--help]"
            echo "  --dry-run: Show what would be changed without making changes"
            echo "  --help: Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN MODE - No files will be modified"
else
    echo "🚨 Starting emergency syntax cleanup..."
    echo "📦 Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Function to safely fix a file
safe_fix_file() {
    local file="$1"
    local backup_file="$BACKUP_DIR/$(basename "$file").backup"
    
    if [ "$DRY_RUN" = true ]; then
        echo "Would process: $file"
        # Show what would be changed
        grep -n 'import;' "$file" 2>/dev/null | head -3 || true
        grep -n 'import"' "$file" 2>/dev/null | head -3 || true
        return
    fi
    
    # Create backup
    cp "$file" "$backup_file"
    echo "📋 Backed up: $file -> $backup_file"
    
    # Apply CONSERVATIVE fixes only
    sed -i '' \
        -e 's/import;$/\/\/ FIXME: Empty import statement/g' \
        -e 's/import"$/import "/g' \
        -e 's/;;$/;/g' \
        "$file"
    
    echo "✏️  Fixed basic syntax in: $file"
}

# Priority files to fix first (core application files)
PRIORITY_FILES=(
    "apps/frontend/src/main.tsx"
    "apps/frontend/src/main.simplified.tsx"
    "packages/backend/src/index.ts"
    "apps/frontend/src/App.tsx"
    "apps/api/src/index.ts"
)

echo "🎯 Processing priority files first..."
for file in "${PRIORITY_FILES[@]}"; do
    if [ -f "$file" ]; then
        safe_fix_file "$file"
    else
        echo "⚠️  Priority file not found: $file"
    fi
done

if [ "$DRY_RUN" = false ]; then
    echo ""
    echo "✅ Emergency cleanup completed!"
    echo "📦 Backups stored in: $BACKUP_DIR"
    echo "⚠️  This was a CONSERVATIVE cleanup - many issues will need manual fixing"
    echo "🔍 Run 'pnpm run dev' to check if basic compilation works now"
    echo ""
    echo "To restore files if something went wrong:"
    echo "  cp $BACKUP_DIR/*.backup <original-location>"
fi
