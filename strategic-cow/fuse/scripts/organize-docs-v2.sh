#!/bin/bash

# Documentation Organization Script v2
# This script moves root documentation INTO the EXISTING docs/ structure
# RESPECTS existing organization!

set -e

echo "📚 Starting documentation organization (respecting existing docs/ structure)..."
echo ""
echo "⚠️  EXISTING docs/ structure detected with 49 subdirectories"
echo "   Moving root files INTO existing structure..."
echo ""

# Count files before
ROOT_MD_COUNT=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Root directory currently has $ROOT_MD_COUNT .md files"
echo ""

# === MOVE TO EXISTING DOCS SUBDIRECTORIES ===

# Architecture (docs/architecture already exists)
echo "Moving architecture docs to docs/architecture/..."
mv -n ARCHITECTURE*.md docs/architecture/ 2>/dev/null || true
mv -n MONOREPO*.md docs/architecture/ 2>/dev/null || true
mv -n CODE_DUPLICATION_REPORT.md docs/architecture/ 2>/dev/null || true
mv -n REFACTORING*.md docs/architecture/ 2>/dev/null || true
mv -n FEATURE_RECREATION_ANALYSIS.md docs/architecture/ 2>/dev/null || true

# Deployment (docs/deployment already exists)
echo "Moving deployment docs to docs/deployment/..."
mv -n DEPLOYMENT*.md docs/deployment/ 2>/dev/null || true
mv -n RAILWAY*.md docs/deployment/ 2>/dev/null || true
mv -n DOCKER*.md docs/deployment/ 2>/dev/null || true

# Development (docs/development already exists)
echo "Moving development docs to docs/development/..."
mv -n BUILD*.md docs/development/ 2>/dev/null || true
mv -n DEPENDENCY*.md docs/development/ 2>/dev/null || true
mv -n monorepo-audit-report.md docs/development/ 2>/dev/null || true
mv -n CODE_QUALITY*.md docs/development/ 2>/dev/null || true
mv -n ESLINT*.md docs/development/ 2>/dev/null || true

# CI/CD (docs/ci-cd already exists)
echo "Moving CI/CD docs to docs/ci-cd/..."
mv -n CI_CD*.md docs/ci-cd/ 2>/dev/null || true

# Agents (docs/agents already exists)
echo "Moving agent docs to docs/agents/..."
mv -n AGENT*.md docs/agents/ 2>/dev/null || true

# Workflows (docs/workflows already exists)
echo "Moving workflow docs to docs/workflows/..."
mv -n WORKFLOW*.md docs/workflows/ 2>/dev/null || true

# Security (docs/security already exists)
echo "Moving security docs to docs/security/..."
mv -n SECURITY*.md docs/security/ 2>/dev/null || true

# Testing (docs/testing already exists)
echo "Moving testing docs to docs/testing/..."
mv -n TESTING*.md docs/testing/ 2>/dev/null || true
mv -n E2E*.md docs/testing/ 2>/dev/null || true

# Performance (docs/performance already exists)
echo "Moving performance docs to docs/performance/..."
mv -n PERFORMANCE*.md docs/performance/ 2>/dev/null || true
mv -n BACKEND_PERFORMANCE*.md docs/performance/ 2>/dev/null || true

# Integrations (docs/integrations already exists)
echo "Moving integration docs to docs/integrations/..."
mv -n MCP*.md docs/integrations/ 2>/dev/null || true
mv -n N8N*.md docs/integrations/ 2>/dev/null || true
mv -n API_DOCUMENTATION*.md docs/integrations/ 2>/dev/null || true

# Project Management (docs/project-management already exists)
echo "Moving project management docs to docs/project-management/..."
mv -n PUBLIC_LAUNCH*.md docs/project-management/ 2>/dev/null || true
mv -n DELIVERABLES.md docs/project-management/ 2>/dev/null || true
mv -n FINAL_SPRINT*.md docs/project-management/ 2>/dev/null || true
mv -n SCRIPTS_REFERENCE.md docs/project-management/ 2>/dev/null || true
mv -n SCRIPT_OPTIMIZATION*.md docs/project-management/ 2>/dev/null || true
mv -n PR*.md docs/project-management/ 2>/dev/null || true

# Resources & Admin
echo "Moving resource/admin docs to docs/admin/..."
mv -n RESOURCES*.md docs/admin/ 2>/dev/null || true
mv -n RESOURCE*.md docs/admin/ 2>/dev/null || true
mv -n ADMIN*.md docs/admin/ 2>/dev/null || true

# WebSocket (docs/websocket already exists)
echo "Moving websocket docs to docs/websocket/..."
mv -n WEBSOCKET*.md docs/websocket/ 2>/dev/null || true

# Background jobs - put in development
echo "Moving background job docs to docs/development/..."
mv -n BACKGROUND*.md docs/development/ 2>/dev/null || true

# Error handling
echo "Moving error handling docs to docs/development/..."
mv -n ERROR_HANDLING*.md docs/development/ 2>/dev/null || true

# GraphQL
echo "Moving GraphQL docs to docs/integrations/..."
mv -n GRAPHQL*.md docs/integrations/ 2>/dev/null || true

# Landing page / UI - move to existing reference or create ui-ux if needed
if [ ! -d "docs/ui-ux" ]; then
  echo "Creating docs/ui-ux/ directory..."
  mkdir -p docs/ui-ux
fi
echo "Moving UI/UX docs to docs/ui-ux/..."
mv -n UI_UX*.md docs/ui-ux/ 2>/dev/null || true
mv -n UX*.md docs/ui-ux/ 2>/dev/null || true
mv -n LANDING*.md docs/ui-ux/ 2>/dev/null || true
mv -n HERO*.md docs/ui-ux/ 2>/dev/null || true
mv -n CTA*.md docs/ui-ux/ 2>/dev/null || true
mv -n RESPONSIVE*.md docs/ui-ux/ 2>/dev/null || true
mv -n FEATURE_SHOWCASE*.md docs/ui-ux/ 2>/dev/null || true

# === ARCHIVE OLD SUMMARIES ===
# Use existing docs/archive directory
echo "Moving completed summaries to docs/archive/..."
mv -n *_SUMMARY.md docs/archive/ 2>/dev/null || true
mv -n *_COMPLETE.md docs/archive/ 2>/dev/null || true
mv -n HANDOFF*.md docs/archive/ 2>/dev/null || true
mv -n WORK_COMPLETED*.md docs/archive/ 2>/dev/null || true
mv -n IMPLEMENTATION_NOTES.md docs/archive/ 2>/dev/null || true
mv -n EMERGENCY_FIXES*.md docs/archive/ 2>/dev/null || true
mv -n QUICK-START-FIXES.md docs/archive/ 2>/dev/null || true
mv -n SYNC_CORE*.md docs/archive/ 2>/dev/null || true
mv -n fix-plan.md docs/archive/ 2>/dev/null || true

# === AUDITS ===
# Move to existing docs/analysis or docs/status-reports
echo "Moving audit files to docs/status-reports/..."
mv -n CODEBASE_AUDIT*.md docs/status-reports/ 2>/dev/null || true
mv -n SELF_IMPROVEMENT*.md docs/status-reports/ 2>/dev/null || true
mv -n *.txt docs/status-reports/ 2>/dev/null || true

echo ""
echo "✅ Documentation organization complete!"
echo ""

# Count files after
ROOT_MD_COUNT_AFTER=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')
MOVED_COUNT=$((ROOT_MD_COUNT - ROOT_MD_COUNT_AFTER))

echo "📊 Summary:"
echo "  - Started with: $ROOT_MD_COUNT files in root"
echo "  - Moved: $MOVED_COUNT files to docs/"
echo "  - Remaining in root: $ROOT_MD_COUNT_AFTER files"
echo ""
echo "📝 Essential docs remaining in root:"
ls -1 *.md 2>/dev/null | sed 's/^/  - /' || echo "  (no markdown files in root)"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the organized structure: ls -R docs/"
echo "  2. Check docs/archive/ for old files you may want to delete"
echo "  3. Commit the changes: git add . && git commit -m 'Organize root documentation into existing docs/ structure'"
echo ""
