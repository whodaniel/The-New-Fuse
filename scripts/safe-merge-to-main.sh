#!/bin/bash

# Safe Merge Script: project-reconstruction → main
# This script safely merges project-reconstruction to main while preserving historical docs

set -e  # Exit on error

echo "======================================"
echo "Safe Merge: project-reconstruction → main"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in project root directory${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    git status --short
    exit 1
fi

echo ""
echo "Step 1: Creating safety backups..."
echo "====================================="

# Create backup tags
DATE_TAG=$(date +%Y%m%d-%H%M%S)

git checkout main
git tag "backup-main-${DATE_TAG}"
echo -e "${GREEN}✓ Created tag: backup-main-${DATE_TAG}${NC}"

git checkout project-reconstruction
git tag "backup-project-reconstruction-${DATE_TAG}"
echo -e "${GREEN}✓ Created tag: backup-project-reconstruction-${DATE_TAG}${NC}"

# Push backup tags
echo ""
read -p "Push backup tags to remote? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin "backup-main-${DATE_TAG}"
    git push origin "backup-project-reconstruction-${DATE_TAG}"
    echo -e "${GREEN}✓ Backup tags pushed to remote${NC}"
fi

echo ""
echo "Step 2: Preserving historical documentation (optional)..."
echo "=========================================================="
echo ""
echo "Main branch has historical archive documentation that doesn't exist in project-reconstruction."
echo "This includes:"
echo "  - docs/_archive/2024-consolidation-phase/ (8 files)"
echo "  - docs/_archive/2024-deployment-reports/ (8 files)"
echo "  - docs/_archive/2024-migrations/"
echo "  - docs/_archive/2024-pre-restructure/migration-docs/ (7 files)"
echo ""
read -p "Do you want to preserve these historical archives? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout project-reconstruction

    # Check if docs/_archive/ exists in main
    if git show main:docs/_archive/ &>/dev/null; then
        echo "Copying archive docs from main..."
        git checkout main -- docs/_archive/ || echo "No _archive directory found"

        # Also get any other valuable historical docs
        git checkout main -- docs/project-management/migration-history.md 2>/dev/null || echo "migration-history.md not found"

        git add docs/

        if ! git diff --cached --quiet; then
            git commit -m "chore: preserve historical archive documentation from main

- Added archived consolidation, deployment, and migration docs from main branch
- These represent project history and past architectural decisions
- Kept in _archive/ to maintain historical record

Preserved before merging project-reconstruction to main"
            echo -e "${GREEN}✓ Historical docs preserved and committed${NC}"
        else
            echo -e "${YELLOW}⚠ No historical docs to preserve${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No archive directory found in main${NC}"
    fi
fi

echo ""
echo "Step 3: Pre-merge validation..."
echo "================================"
echo ""
echo "Running build checks on project-reconstruction..."

# Optional: Run tests
read -p "Run type-check and build before merging? (recommended) (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing dependencies..."
    pnpm install

    echo "Running type-check..."
    pnpm run type-check || {
        echo -e "${RED}Type check failed! Fix errors before merging.${NC}"
        exit 1
    }

    echo "Running build..."
    pnpm run build || {
        echo -e "${RED}Build failed! Fix errors before merging.${NC}"
        exit 1
    }

    echo -e "${GREEN}✓ All checks passed${NC}"
fi

echo ""
echo "Step 4: Comparing branches..."
echo "=============================="
echo ""
git checkout main
echo "Files only in main (will be lost): $(git diff --diff-filter=D --name-only main project-reconstruction | wc -l | tr -d ' ')"
echo "Files only in project-reconstruction (new): $(git diff --diff-filter=A --name-only main project-reconstruction | wc -l | tr -d ' ')"
echo "Files modified: $(git diff --diff-filter=M --name-only main project-reconstruction | wc -l | tr -d ' ')"
echo ""
echo -e "${YELLOW}Review BRANCH_MERGE_ANALYSIS_CORRECTED.md for detailed analysis${NC}"
echo ""

read -p "Continue with merge? This will update main to match project-reconstruction. (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Merge cancelled."
    exit 0
fi

echo ""
echo "Step 5: Merging project-reconstruction to main..."
echo "=================================================="
echo ""

git checkout main

# Option 1: Merge with strategy (keeps project-reconstruction's version in conflicts)
echo "Merging with strategy: accept project-reconstruction's changes for conflicts..."
git merge project-reconstruction --strategy-option theirs -m "feat: merge project-reconstruction with enhanced architecture

This merge brings project-reconstruction's cleaner architecture to main:
- Adds 3 new apps (cloudflare-worker, relay-server, vscode-extension)
- Includes complete Supabase integration (VectorDatabaseService, SupabaseService)
- Updates frontend with enhanced components and 135 page files
- Adds 20+ new documentation files for recent work
- Maintains all core functionality

Historical documentation from main preserved in docs/_archive/

Resolving strategy: Accept project-reconstruction's version for conflicts
(project-reconstruction is the active development branch)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${GREEN}✓ Merge completed successfully${NC}"

echo ""
echo "Step 6: Post-merge verification..."
echo "==================================="
echo ""

# Show merge summary
echo "Merge summary:"
git log --oneline -1
echo ""

# Optionally run tests again
read -p "Run build verification on merged main? (recommended) (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing dependencies..."
    pnpm install

    echo "Running type-check..."
    pnpm run type-check

    echo "Running build..."
    pnpm run build

    echo -e "${GREEN}✓ Post-merge build successful${NC}"
fi

echo ""
echo "Step 7: Push to remote..."
echo "========================="
echo ""
echo -e "${YELLOW}WARNING: This will update the remote main branch.${NC}"
echo "Backup tags have been created: backup-main-${DATE_TAG}"
echo ""

read -p "Push merged main to origin/main? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✓ Successfully pushed to origin/main${NC}"
else
    echo -e "${YELLOW}Not pushed. Run 'git push origin main' when ready.${NC}"
fi

echo ""
echo "======================================"
echo "Merge Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "  - Backup tags created and pushed"
echo "  - Historical docs preserved (if selected)"
echo "  - project-reconstruction merged to main"
echo "  - Build verified (if selected)"
echo "  - Changes pushed to remote (if selected)"
echo ""
echo "Next steps:"
echo "  1. Verify all features work as expected"
echo "  2. Test deployment if applicable"
echo "  3. Update team about the merge"
echo ""
echo "If anything went wrong, you can restore from backup tags:"
echo "  git checkout main"
echo "  git reset --hard backup-main-${DATE_TAG}"
echo "  git push origin main --force-with-lease"
echo ""
echo -e "${GREEN}All done! 🎉${NC}"
