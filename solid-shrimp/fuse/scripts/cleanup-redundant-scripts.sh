#!/bin/bash
set -e

echo "🧹 Starting cleanup of redundant scripts..."

# Create a backup of all scripts before deletion
BACKUP_DIR="./backups/scripts_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "./scripts" "$BACKUP_DIR"
echo "✅ Scripts backed up to $BACKUP_DIR"

# List of scripts that are now redundant due to consolidation
REDUNDANT_SCRIPTS=(
  "./scripts/fix-peer-dependencies.sh"
  "./scripts/fix-firebase-deps.sh"
  "./scripts/fix-react-deps.sh"
  "./scripts/fix-metadata-deps.sh"
  "./scripts/fix-typeorm-deps.sh"
  "./scripts/fix-dependencies.sh"
  "./scripts/fix-peer-deps.sh"
)

# Remove redundant scripts
echo "🗑️ Removing redundant scripts..."
for script in "${REDUNDANT_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "Removing $script"
    rm "$script"
  else
    echo "Script $script not found, skipping"
  fi
done

echo "✅ Redundant scripts cleanup completed!"
echo "📝 The following scripts have been consolidated into 'consolidated-dependencies.sh':"
echo "  - fix-peer-dependencies.sh"
echo "  - fix-firebase-deps.sh"
echo "  - fix-react-deps.sh"
echo "  - fix-metadata-deps.sh"
echo "  - fix-typeorm-deps.sh"
echo "  - fix-dependencies.sh"
echo "  - fix-peer-deps.sh"