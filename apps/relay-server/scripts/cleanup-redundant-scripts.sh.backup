#!/bin/bash
set -e

echo "🧹 Starting cleanup of redundant scripts..."

# Create a backup of all scripts before deletion
BACKUP_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/backups/scripts_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts" "$BACKUP_DIR"
echo "✅ Scripts backed up to $BACKUP_DIR"

# List of scripts that are now redundant due to consolidation
REDUNDANT_SCRIPTS=(
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-peer-dependencies.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-firebase-deps.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-react-deps.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-metadata-deps.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-typeorm-deps.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-dependencies.sh"
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/scripts/fix-peer-deps.sh"
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