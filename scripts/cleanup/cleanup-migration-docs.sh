#!/bin/bash

# Cleanup Script for Migration Documentation
# This script moves redundant migration documentation to archive
# and removes test logs to free up disk space

set -e

echo "🧹 The New Fuse - Migration Documentation Cleanup"
echo "=================================================="
echo ""

# Create archive directory if it doesn't exist
ARCHIVE_DIR="docs/_archive/2024-pre-restructure/migration-docs"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Moving migration documentation to archive..."
echo ""

# Move Chakra migration docs
echo "  Moving Chakra UI migration documents..."
mv -v CHAKRA_COMPLETE_AUDIT.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CHAKRA_COMPLETE_AUDIT.md already moved"
mv -v CHAKRA_MIGRATION_REMAINING.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CHAKRA_MIGRATION_REMAINING.md already moved"
mv -v CHAKRA_MIGRATION_STATUS.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CHAKRA_MIGRATION_STATUS.md already moved"
mv -v CHAKRA_REMOVAL_COMPLETED.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CHAKRA_REMOVAL_COMPLETED.md already moved"

# Move Redis migration docs
echo "  Moving Redis migration documents..."
mv -v REDIS_MIGRATION_COMPLETE.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ REDIS_MIGRATION_COMPLETE.md already moved"
mv -v REDIS_MIGRATION_PHASE1A_COMPLETE.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ REDIS_MIGRATION_PHASE1A_COMPLETE.md already moved"
mv -v REDIS_MIGRATION_PHASE1B_COMPLETE.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ REDIS_MIGRATION_PHASE1B_COMPLETE.md already moved"
mv -v REDIS_LEGACY_CLEANUP_REPORT.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ REDIS_LEGACY_CLEANUP_REPORT.md already moved"

# Move SkIDEancer/Browser Hub docs
echo "  Moving Browser Hub documents..."
mv -v THEIA_BUILD_PROCESS.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ THEIA_BUILD_PROCESS.md already moved"
mv -v THEIA_SERVER_SUCCESS.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ THEIA_SERVER_SUCCESS.md already moved"

# Move implementation and consolidation docs
echo "  Moving implementation documents..."
mv -v IMPLEMENTATION_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ IMPLEMENTATION_SUMMARY.md already moved"
mv -v CONSOLIDATION_CHECKLIST.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CONSOLIDATION_CHECKLIST.md already moved"
mv -v CONSOLIDATION_INDEX.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CONSOLIDATION_INDEX.md already moved"

# Move blockchain/NFT docs
echo "  Moving blockchain documents..."
mv -v NFT_AGENT_SYSTEM_DOCUMENTATION.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ NFT_AGENT_SYSTEM_DOCUMENTATION.md already moved"
mv -v BLOCKCHAIN_REFACTORING_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ BLOCKCHAIN_REFACTORING_SUMMARY.md already moved"

# Move other migration status docs
echo "  Moving other status documents..."
mv -v SETUP_INSTRUCTIONS.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ SETUP_INSTRUCTIONS.md already moved"
mv -v CHROME_DEVTOOLS_BETA_TESTING_GUIDE.md "$ARCHIVE_DIR/" 2>/dev/null || echo "    ✓ CHROME_DEVTOOLS_BETA_TESTING_GUIDE.md already moved"

echo ""
echo "🗑️  Removing large test logs..."
echo ""

# Remove large test output logs
if [ -f "packages/integration-tests/test-output-fixed.log" ]; then
    SIZE=$(du -h "packages/integration-tests/test-output-fixed.log" | cut -f1)
    rm -v "packages/integration-tests/test-output-fixed.log"
    echo "    ✓ Removed test-output-fixed.log ($SIZE)"
else
    echo "    ✓ test-output-fixed.log already removed"
fi

if [ -f "packages/integration-tests/test-output.log" ]; then
    SIZE=$(du -h "packages/integration-tests/test-output.log" | cut -f1)
    rm -v "packages/integration-tests/test-output.log"
    echo "    ✓ Removed test-output.log ($SIZE)"
else
    echo "    ✓ test-output.log already removed"
fi

# Remove .DS_Store files
echo ""
echo "🍎 Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
echo "    ✓ Removed all .DS_Store files"

# Clean .turbo caches (they can be regenerated)
echo ""
echo "🔄 Cleaning .turbo build caches..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
echo "    ✓ Cleaned .turbo directories"

echo ""
echo "📝 Creating archive README..."

# Create README in archive
cat > "$ARCHIVE_DIR/README.md" << 'EOF'
# Migration Documentation Archive

This directory contains historical migration documentation that has been consolidated into [migration-history.md](../../project-management/migration-history.md).

## What's Here

This archive contains documentation from various system migrations:

- **Chakra UI → Tailwind CSS** migration documents
- **Redis Consolidation** phase reports
- **Browser Hub** build optimization documentation
- **Blockchain Integration** implementation summaries
- **Documentation Consolidation** checklists

## Why Archived?

These files were consolidated to:
- Reduce documentation fragmentation
- Provide single source of truth
- Improve discoverability
- Reduce repository clutter

## Current Documentation

For current information on any of these migrations, see:
- [Migration History](../../project-management/migration-history.md) - Complete consolidated history

## Restoration

If you need to reference the original documents, they remain in this archive with full git history preserved.

---

*Archived: October 24, 2025*
EOF

echo "    ✓ Created archive README"

echo ""
echo "✅ Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "  • Migration docs moved to: $ARCHIVE_DIR/"
echo "  • Test logs removed from packages/integration-tests/"
echo "  • .DS_Store files cleaned"
echo "  • .turbo caches cleared"
echo ""
echo "📖 Consolidated documentation available at:"
echo "  • docs/project-management/migration-history.md"
echo ""
echo "💾 Space Saved: Run 'du -sh .' to see current project size"
echo ""
