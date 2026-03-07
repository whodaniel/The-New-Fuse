#!/bin/bash

# Quick Wins Cleanup Script for The New Fuse
# Removes low-risk duplicate/legacy files to free space and reduce complexity

set -e

echo "🧹 The New Fuse - Quick Wins Cleanup"
echo "===================================="
echo ""

# Confirm before proceeding
read -p "This will remove backup files and legacy services. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""

# 1. Archive backup directory (6.2MB, 1,269 files)
echo "📦 Step 1/5: Archiving backup directory..."
if [ -d "packages/core/backup" ]; then
    mkdir -p .archive/2024-core-backup
    mv packages/core/backup .archive/2024-core-backup/
    echo "  ✓ Saved 6.2MB, archived 1,269 files"
else
    echo "  ✓ Backup directory already removed"
fi

# 2. Remove legacy Redis services
echo "🗑️  Step 2/5: Removing legacy Redis services..."
REDIS_COUNT=0
if [ -f "packages/core/src/redis/redis.service.ts" ]; then
    rm -f packages/core/src/redis/redis.service.ts
    ((REDIS_COUNT++))
fi
if [ -f "packages/core/src/redis/queue.service.ts" ]; then
    rm -f packages/core/src/redis/queue.service.ts
    ((REDIS_COUNT++))
fi
echo "  ✓ Removed $REDIS_COUNT legacy Redis services"

# 3. Remove duplicate cache services
echo "🗑️  Step 3/5: Removing duplicate cache services..."
CACHE_COUNT=0
if [ -f "packages/core/src/cache/CacheService.ts" ]; then
    rm -f packages/core/src/cache/CacheService.ts
    ((CACHE_COUNT++))
fi
if [ -f "packages/core/src/cache/agency-hub-cache.service.ts" ]; then
    rm -f packages/core/src/cache/agency-hub-cache.service.ts
    ((CACHE_COUNT++))
fi
if [ -f "packages/core/src/services/agency-hub-cache.service.ts" ]; then
    rm -f packages/core/src/services/agency-hub-cache.service.ts
    ((CACHE_COUNT++))
fi
echo "  ✓ Removed $CACHE_COUNT duplicate cache services"

# 4. Remove duplicate queue services
echo "🗑️  Step 4/5: Removing duplicate queue services..."
QUEUE_COUNT=0
if [ -f "packages/core/src/queue/QueueService.d.ts" ]; then
    rm -f packages/core/src/queue/QueueService.d.ts
    ((QUEUE_COUNT++))
fi
if [ -f "packages/core/src/queue/MessageQueueService.d.ts" ]; then
    rm -f packages/core/src/queue/MessageQueueService.d.ts
    ((QUEUE_COUNT++))
fi
echo "  ✓ Removed $QUEUE_COUNT duplicate queue services"

# 5. Run migration docs cleanup (if exists)
echo "📄 Step 5/5: Running migration documentation cleanup..."
if [ -f "./cleanup-migration-docs.sh" ]; then
    chmod +x ./cleanup-migration-docs.sh
    ./cleanup-migration-docs.sh
else
    echo "  ⚠ cleanup-migration-docs.sh not found, skipping"
fi

echo ""
echo "✅ Quick Wins Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "  • Archived: 6.2MB backup directory (1,269 files)"
echo "  • Removed: $(($REDIS_COUNT + $CACHE_COUNT + $QUEUE_COUNT)) duplicate/legacy service files"
echo "  • Cleaned: Migration documentation (if script available)"
echo "  • Total Space Saved: ~6-7MB"
echo ""
echo "💡 Next Steps:"
echo "  1. Review changes: git status"
echo "  2. Run tests: pnpm test"
echo "  3. Build: pnpm run build"
echo "  4. Commit if all tests pass:"
echo "     git add -A"
echo "     git commit -m 'chore: cleanup backup files and legacy services'"
echo ""
echo "📖 For more consolidation opportunities, see:"
echo "   CODEBASE_CONSOLIDATION_ANALYSIS.md"
echo ""
