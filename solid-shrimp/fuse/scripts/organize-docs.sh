#!/bin/bash

# Documentation Organization Script
# This script organizes the 90+ documentation files into a structured docs/ directory

set -e

echo "📚 Starting documentation organization..."

# Create directory structure
echo "Creating docs/ directory structure..."
mkdir -p docs/{architecture,deployment,development,features,security,testing,performance,ui-ux,audits,integrations,archive,project-management}

# Architecture
echo "Moving architecture docs..."
mv -n ARCHITECTURE*.md docs/architecture/ 2>/dev/null || true
mv -n MONOREPO*.md docs/architecture/ 2>/dev/null || true
mv -n CODE_DUPLICATION_REPORT.md docs/architecture/ 2>/dev/null || true
mv -n REFACTORING*.md docs/architecture/ 2>/dev/null || true
mv -n FEATURE_RECREATION_ANALYSIS.md docs/architecture/ 2>/dev/null || true

# Deployment
echo "Moving deployment docs..."
mv -n DEPLOYMENT*.md docs/deployment/ 2>/dev/null || true
mv -n RAILWAY*.md docs/deployment/ 2>/dev/null || true
mv -n DOCKER*.md docs/deployment/ 2>/dev/null || true
mv -n CI_CD*.md docs/deployment/ 2>/dev/null || true

# Development
echo "Moving development docs..."
mv -n BUILD*.md docs/development/ 2>/dev/null || true
mv -n DEPENDENCY*.md docs/development/ 2>/dev/null || true
mv -n monorepo-audit-report.md docs/development/ 2>/dev/null || true
mv -n CODE_QUALITY*.md docs/development/ 2>/dev/null || true
mv -n ESLINT*.md docs/development/ 2>/dev/null || true

# Features
echo "Moving feature docs..."
mv -n AGENT*.md docs/features/ 2>/dev/null || true
mv -n WORKFLOW*.md docs/features/ 2>/dev/null || true
mv -n RESOURCES*.md docs/features/ 2>/dev/null || true
mv -n RESOURCE*.md docs/features/ 2>/dev/null || true
mv -n ADMIN*.md docs/features/ 2>/dev/null || true
mv -n GRAPHQL*.md docs/features/ 2>/dev/null || true
mv -n WEBSOCKET*.md docs/features/ 2>/dev/null || true
mv -n BACKGROUND*.md docs/features/ 2>/dev/null || true
mv -n ERROR_HANDLING*.md docs/features/ 2>/dev/null || true

# Security
echo "Moving security docs..."
mv -n SECURITY*.md docs/security/ 2>/dev/null || true

# Testing
echo "Moving testing docs..."
mv -n TESTING*.md docs/testing/ 2>/dev/null || true
mv -n E2E*.md docs/testing/ 2>/dev/null || true

# Performance
echo "Moving performance docs..."
mv -n PERFORMANCE*.md docs/performance/ 2>/dev/null || true
mv -n BACKEND_PERFORMANCE*.md docs/performance/ 2>/dev/null || true

# UI/UX
echo "Moving UI/UX docs..."
mv -n UI_UX*.md docs/ui-ux/ 2>/dev/null || true
mv -n UX*.md docs/ui-ux/ 2>/dev/null || true
mv -n LANDING*.md docs/ui-ux/ 2>/dev/null || true
mv -n HERO*.md docs/ui-ux/ 2>/dev/null || true
mv -n CTA*.md docs/ui-ux/ 2>/dev/null || true
mv -n RESPONSIVE*.md docs/ui-ux/ 2>/dev/null || true
mv -n FEATURE_SHOWCASE*.md docs/ui-ux/ 2>/dev/null || true

# Audits
echo "Moving audit docs..."
mv -n CODEBASE_AUDIT*.md docs/audits/ 2>/dev/null || true
mv -n SELF_IMPROVEMENT*.md docs/audits/ 2>/dev/null || true
mv -n *.txt docs/audits/ 2>/dev/null || true

# Integrations
echo "Moving integration docs..."
mv -n MCP*.md docs/integrations/ 2>/dev/null || true
mv -n N8N*.md docs/integrations/ 2>/dev/null || true
mv -n API_DOCUMENTATION*.md docs/integrations/ 2>/dev/null || true

# Project Management
echo "Moving project management docs..."
mv -n PUBLIC_LAUNCH*.md docs/project-management/ 2>/dev/null || true
mv -n DELIVERABLES.md docs/project-management/ 2>/dev/null || true
mv -n FINAL_SPRINT*.md docs/project-management/ 2>/dev/null || true
mv -n SCRIPTS_REFERENCE.md docs/project-management/ 2>/dev/null || true
mv -n SCRIPT_OPTIMIZATION*.md docs/project-management/ 2>/dev/null || true
mv -n PR*.md docs/project-management/ 2>/dev/null || true

# Archive old summaries and completed work
echo "Moving completed summaries to archive..."
mv -n *_SUMMARY.md docs/archive/ 2>/dev/null || true
mv -n *_COMPLETE.md docs/archive/ 2>/dev/null || true
mv -n HANDOFF*.md docs/archive/ 2>/dev/null || true
mv -n WORK_COMPLETED*.md docs/archive/ 2>/dev/null || true
mv -n IMPLEMENTATION_NOTES.md docs/archive/ 2>/dev/null || true
mv -n EMERGENCY_FIXES*.md docs/archive/ 2>/dev/null || true
mv -n QUICK-START-FIXES.md docs/archive/ 2>/dev/null || true
mv -n SYNC_CORE*.md docs/archive/ 2>/dev/null || true
mv -n fix-plan.md docs/archive/ 2>/dev/null || true

# Keep in root (don't move these)
echo "Keeping essential docs in root:"
echo "  - README.md"
echo "  - PRODUCTION_READINESS.md"
echo "  - QUICK_START_GUIDE.md"
echo "  - DOCUMENTATION_INDEX.md"
echo "  - REMAINING_WORK.md"
echo "  - task.md"

# Create README in docs/
cat > docs/README.md << 'EOF'
# The New Fuse Documentation

This directory contains organized project documentation.

## Directory Structure

- **architecture/** - Architecture standards, monorepo structure, refactoring
- **deployment/** - Deployment guides, CI/CD, Railway, Docker
- **development/** - Build system, dependencies, development setup
- **features/** - Feature-specific documentation (agents, workflows, etc.)
- **security/** - Security fixes, audits, incident response
- **testing/** - Testing setup, E2E tests, quality tools
- **performance/** - Performance optimization guides
- **ui-ux/** - UI/UX audits, landing page, design system
- **audits/** - Codebase audits, self-improvement reports
- **integrations/** - MCP, n8n, API documentation
- **project-management/** - Roadmaps, deliverables, sprint summaries
- **archive/** - Completed summaries, old reports

## Quick Links

- [Documentation Index](../DOCUMENTATION_INDEX.md) - Complete documentation catalog
- [Production Readiness](../PRODUCTION_READINESS.md) - Current production status
- [README](../README.md) - Project overview

## Navigation

For the complete categorized list of all documentation, see [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) in the root directory.
EOF

echo ""
echo "✅ Documentation organization complete!"
echo ""
echo "📁 Directory structure created:"
ls -d docs/*/ | sed 's/^/  - /'
echo ""
echo "📝 Root directory now contains only essential docs:"
ls -1 *.md 2>/dev/null | sed 's/^/  - /' || echo "  (no markdown files in root)"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the organized structure in docs/"
echo "  2. Check docs/archive/ for old files you may want to delete"
echo "  3. Update any links in code that reference moved files"
echo "  4. Commit the changes: git add docs/ && git commit -m 'Organize documentation'"
echo ""
