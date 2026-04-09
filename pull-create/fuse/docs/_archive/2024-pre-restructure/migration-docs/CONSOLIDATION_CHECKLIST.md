# Consolidation Implementation Checklist

This is a practical, step-by-step checklist for implementing the consolidation plan.

**Before you start:** Read [CONSOLIDATION_PLAN.md](./CONSOLIDATION_PLAN.md) completely.

---

## Pre-Consolidation Setup

### Preparation

- [ ] Read CONSOLIDATION_PLAN.md completely
- [ ] Read CONSOLIDATION_SUMMARY.md
- [ ] Read BEFORE_AFTER_COMPARISON.md
- [ ] Share plan with team for feedback
- [ ] Get stakeholder approval
- [ ] Set consolidation start date
- [ ] Schedule team meeting to explain changes

### Create Backup

- [ ] Create backup branch:
  ```bash
  git checkout -b backup-pre-consolidation
  git push origin backup-pre-consolidation
  ```
- [ ] Verify backup exists on remote
- [ ] Create local backup of entire directory (optional)

### Install Tools

- [ ] Install markdown link checker (optional):
  ```bash
  npm install -g markdown-link-check
  ```
- [ ] Install ripgrep for searching (optional):
  ```bash
  brew install ripgrep  # macOS
  ```

### Create Working Branch

- [ ] Create consolidation branch:
  ```bash
  git checkout -b consolidation-2024
  ```
- [ ] You'll commit work in phases to this branch

---

## Week 1: Documentation Audit

### Day 1-2: Port Management Audit

- [ ] List all port management files:
  ```bash
  find docs -name "*port*" -o -name "*PORT*" | grep -i port
  ```
- [ ] Read each file, note unique content
- [ ] Create content comparison spreadsheet/doc
- [ ] Plan merge strategy
- [ ] Draft consolidated outline

### Day 3-4: MCP Documentation Audit

- [ ] List all MCP files:
  ```bash
  find docs -name "*MCP*" -o -name "*mcp*"
  ```
- [ ] Read each file (14 files total)
- [ ] Create content comparison matrix
- [ ] Identify: API guide vs spec vs troubleshooting
- [ ] Draft 3 consolidated outlines

### Day 5: Development Guides Audit

- [ ] Find all development guides:
  ```bash
  find docs -name "*DEVELOPMENT*" -o -name "*development*"
  ```
- [ ] Read all 3 files
- [ ] Note unique content in each
- [ ] Draft consolidated outline
- [ ] Verify includes setup, workflow, best practices

---

## Week 2: Port Management & MCP Consolidation

### Day 1: Port Management - Architecture Doc

- [ ] Create file: `docs/reference/architecture/port-management.md`
- [ ] Add header with last updated date
- [ ] Write table of contents
- [ ] Copy/merge architecture details from all sources
- [ ] Add port allocation table
- [ ] Add configuration instructions
- [ ] Add environment variables section
- [ ] Add examples
- [ ] Add quick reference section
- [ ] Review for completeness
- [ ] Test all examples
- [ ] Commit:
  ```bash
  git add docs/reference/architecture/port-management.md
  git commit -m "docs: consolidate port management architecture (8→2 files)"
  ```

### Day 2: Port Management - Troubleshooting Doc

- [ ] Create file: `docs/troubleshooting/port-management.md`
- [ ] Add header with last updated date
- [ ] Write table of contents
- [ ] Copy common issues from all sources
- [ ] Add solutions for each issue
- [ ] Add diagnostic commands
- [ ] Add cross-reference to architecture doc
- [ ] Test all solutions
- [ ] Commit:
  ```bash
  git add docs/troubleshooting/port-management.md
  git commit -m "docs: consolidate port management troubleshooting"
  ```

### Day 2 (cont): Archive Old Port Docs

- [ ] Move old files to archive:
  ```bash
  mkdir -p docs/_archive/2024-pre-restructure/port-docs
  git mv docs/PORT_MANAGEMENT.md docs/_archive/2024-pre-restructure/port-docs/
  git mv docs/PORT_MANAGEMENT_ARCHITECTURE.md docs/_archive/2024-pre-restructure/port-docs/
  git mv docs/PORT-MAPPING.md docs/_archive/2024-pre-restructure/port-docs/
  # ... move all 8 files
  ```
- [ ] Commit:
  ```bash
  git commit -m "docs: archive old port management files"
  ```

### Day 3: MCP Integration Guide

- [ ] Create file: `docs/guides/mcp-integration.md`
- [ ] Add header with last updated date
- [ ] Write comprehensive table of contents
- [ ] Sections to include:
  - [ ] Getting Started with MCP
  - [ ] Installation & Setup
  - [ ] Configuration
  - [ ] API Integration Guide
  - [ ] Component Analysis
  - [ ] UI Integration
  - [ ] Extending MCP Server
  - [ ] Examples
- [ ] Merge content from 14 source files
- [ ] Remove duplicates
- [ ] Add cross-references
- [ ] Test all examples
- [ ] Commit:
  ```bash
  git add docs/guides/mcp-integration.md
  git commit -m "docs: consolidate MCP integration guide (14→3 files)"
  ```

### Day 4: MCP Specification

- [ ] Create file: `docs/reference/protocols/mcp-specification.md`
- [ ] Add header
- [ ] Write table of contents
- [ ] Sections:
  - [ ] Complete Specification
  - [ ] Architecture
  - [ ] Protocol Details
  - [ ] Tasks Reference
  - [ ] Server Documentation
- [ ] Merge spec content from sources
- [ ] Keep technical and precise
- [ ] Add cross-reference to integration guide
- [ ] Commit:
  ```bash
  git add docs/reference/protocols/mcp-specification.md
  git commit -m "docs: consolidate MCP specification"
  ```

### Day 4 (cont): MCP Troubleshooting

- [ ] Create file: `docs/troubleshooting/mcp.md`
- [ ] Add header
- [ ] Write table of contents
- [ ] Sections:
  - [ ] Common Issues
  - [ ] Server Problems
  - [ ] Connection Issues
  - [ ] Configuration Errors
  - [ ] Solutions & Diagnostics
- [ ] Merge troubleshooting from all sources
- [ ] Test all solutions
- [ ] Add cross-references
- [ ] Commit:
  ```bash
  git add docs/troubleshooting/mcp.md
  git commit -m "docs: consolidate MCP troubleshooting"
  ```

### Day 5: Archive Old MCP Docs

- [ ] Add README to specifications/_archive/:
  ```bash
  cat > docs/specifications/_archive/README.md << 'EOF'
  # MCP Specifications Archive

  This directory contains historical MCP specification files.

  **Current Documentation:**
  - Integration: docs/guides/mcp-integration.md
  - Specification: docs/reference/protocols/mcp-specification.md
  - Troubleshooting: docs/troubleshooting/mcp.md

  These files are kept for historical reference.
  EOF
  ```
- [ ] Move root MCP docs:
  ```bash
  mkdir -p docs/_archive/2024-pre-restructure/mcp-docs
  git mv docs/MCP*.md docs/_archive/2024-pre-restructure/mcp-docs/
  ```
- [ ] Keep protocols/_archive/ as-is (already archived)
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "docs: archive old MCP files, add archive README"
  ```

---

## Week 3: Development Guides & Getting Started

### Day 1: Development Guide

- [ ] Create file: `docs/guides/development.md`
- [ ] Read all 3 source development files
- [ ] Write comprehensive guide including:
  - [ ] Prerequisites
  - [ ] Development Environment Setup
  - [ ] Project Structure
  - [ ] Development Workflow
  - [ ] Running the Application
  - [ ] Making Changes
  - [ ] Testing
  - [ ] Debugging
  - [ ] Best Practices
  - [ ] Troubleshooting Common Issues
- [ ] Test setup on clean machine (if possible)
- [ ] Commit:
  ```bash
  git add docs/guides/development.md
  git commit -m "docs: consolidate development guide (3→1 file)"
  ```
- [ ] Archive old files:
  ```bash
  git mv docs/DEVELOPMENT.md docs/_archive/2024-pre-restructure/
  ```

### Day 2: Getting Started

- [ ] Create `docs/getting-started/README.md` (main quick start)
- [ ] Sections:
  - [ ] Overview
  - [ ] Quick Start (5-minute version)
  - [ ] What's Included
  - [ ] Next Steps
- [ ] Update `docs/getting-started/prerequisites.md`
- [ ] Extract from GETTING_STARTED.md
- [ ] Update `docs/getting-started/installation.md`
- [ ] Ensure current and accurate
- [ ] Update `docs/getting-started/quick-start.md`
- [ ] Streamline for fastest path to productivity
- [ ] Test complete flow
- [ ] Commit:
  ```bash
  git add docs/getting-started/
  git commit -m "docs: consolidate getting started documentation"
  ```
- [ ] Archive old:
  ```bash
  git mv docs/GETTING_STARTED.md docs/_archive/2024-pre-restructure/
  ```

### Day 3: Troubleshooting Directory

- [ ] Review all files in `docs/development-and-troubleshooting/`
- [ ] Categorize each file:
  - Troubleshooting → `docs/troubleshooting/`
  - Guides → `docs/guides/`
  - Archive → `docs/_archive/implementation-logs/`
- [ ] Create `docs/troubleshooting/README.md`
- [ ] Create `docs/troubleshooting/general.md`
- [ ] Create `docs/troubleshooting/frontend.md`
- [ ] Create `docs/troubleshooting/typescript.md`
- [ ] Merge content from source files
- [ ] Commit:
  ```bash
  git add docs/troubleshooting/
  git commit -m "docs: consolidate troubleshooting guides"
  ```

### Day 4: Archive Implementation Logs

- [ ] Create archive structure:
  ```bash
  mkdir -p docs/_archive/implementation-logs
  mkdir -p docs/_archive/deprecated-guides
  mkdir -p docs/_archive/fixes
  ```
- [ ] Move implementation logs:
  ```bash
  git mv docs/development-and-troubleshooting/DEVELOPMENT_PROGRESS_LOG.md \
         docs/_archive/implementation-logs/
  git mv docs/development-and-troubleshooting/CLAUDE_DEV_IMPLEMENTATION_LOG.md \
         docs/_archive/implementation-logs/
  # ... etc
  ```
- [ ] Move one-time fixes to fixes/:
  ```bash
  git mv docs/development-and-troubleshooting/MANUAL_SELECTION_PANEL_FIX.md \
         docs/_archive/fixes/
  ```
- [ ] Commit:
  ```bash
  git commit -m "docs: archive implementation logs and one-time fixes"
  ```

### Day 5: Project Documentation

- [ ] Review `docs/project/`, `docs/project-management/`, `docs/project-planning/`
- [ ] Identify overlaps
- [ ] Keep best content in `docs/project/`
- [ ] Create subdirectories if needed:
  ```bash
  mkdir -p docs/project/planning
  mkdir -p docs/project/decisions
  ```
- [ ] Move relevant content
- [ ] Archive old content:
  ```bash
  mkdir -p docs/_archive/2024-pre-restructure/project-docs
  git mv docs/project-planning/* docs/_archive/2024-pre-restructure/project-docs/
  # Keep project-management if still relevant
  ```
- [ ] Commit:
  ```bash
  git commit -m "docs: consolidate project documentation"
  ```

---

## Week 4: New README & Architecture

### Day 1-2: Main README

- [ ] Design README structure
- [ ] Write `docs/README.md`:
  - [ ] Welcome section
  - [ ] What is The New Fuse
  - [ ] Quick navigation with links to all sections:
    - [ ] Getting Started
    - [ ] Guides
    - [ ] Reference
    - [ ] Troubleshooting
    - [ ] Project
  - [ ] Quick Start section
  - [ ] How to Navigate These Docs
  - [ ] Contributing to Documentation
- [ ] Test all links
- [ ] Get team feedback
- [ ] Iterate based on feedback
- [ ] Commit:
  ```bash
  git add docs/README.md
  git commit -m "docs: create comprehensive main README"
  ```

### Day 3: Architecture Documentation

- [ ] Create `docs/reference/architecture/overview.md`
- [ ] Sections:
  - [ ] System Architecture Overview
  - [ ] High-Level Components
  - [ ] Data Flow
  - [ ] Communication Patterns
  - [ ] Key Design Decisions
- [ ] Already have `port-management.md`
- [ ] Create `docs/reference/architecture/agent-system.md`
- [ ] Create `docs/reference/architecture/vector-database.md`
- [ ] Move content from VECTOR_DATABASE_HARMONIZATION.md
- [ ] Commit:
  ```bash
  git add docs/reference/architecture/
  git commit -m "docs: add architecture documentation"
  ```

### Day 4: Archive READMEs

- [ ] Create `docs/_archive/README.md`:
  ```markdown
  # Documentation Archive

  This directory contains historical documentation files.

  ## What's Here

  - `2024-pre-restructure/`: Docs from before consolidation
  - `deprecated-guides/`: Outdated guides
  - `implementation-logs/`: Development session logs
  - `fixes/`: One-time fix documentation

  ## Why Archived?

  Files are archived when:
  - Replaced by newer, consolidated docs
  - No longer relevant to current system
  - Kept for historical reference only

  ## Finding Current Docs

  See the main [docs/README.md](../README.md) for current documentation.
  ```
- [ ] Commit:
  ```bash
  git add docs/_archive/README.md
  git commit -m "docs: add archive README explaining structure"
  ```

### Day 5: Update Cross-References

- [ ] Search for broken links:
  ```bash
  find docs -name "*.md" -exec grep -l "](.*\.md)" {} \;
  ```
- [ ] Update links to moved files
- [ ] Run link checker:
  ```bash
  find docs -name "*.md" -exec markdown-link-check {} \;
  ```
- [ ] Fix broken links
- [ ] Commit:
  ```bash
  git commit -am "docs: update cross-references and fix broken links"
  ```

---

## Week 5: Scripts Preparation

### Day 1: Create Scripts Structure

- [ ] Create new directory structure:
  ```bash
  cd scripts
  mkdir -p core build launch database mcp maintenance development testing
  mkdir -p _deprecated/2024-q4/{fix-scripts,root-builds,root-launches,root-fixes,root-setup}
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: create new directory structure"
  ```

### Day 2: Audit Active Scripts

- [ ] List recently modified scripts:
  ```bash
  ls -lt scripts/*.sh | head -20
  ```
- [ ] Identify scripts actually in use
- [ ] Test top 10 most important scripts
- [ ] Create list of scripts to keep vs deprecate
- [ ] Document findings

### Day 3: Create Scripts README Draft

- [ ] Draft `scripts/README.md`
- [ ] Sections:
  - [ ] Quick Start
  - [ ] Core Scripts
  - [ ] Build Scripts
  - [ ] Launch Scripts
  - [ ] Database Scripts
  - [ ] MCP Scripts
  - [ ] Maintenance Scripts
  - [ ] Development Scripts
  - [ ] Testing Scripts
  - [ ] Deprecated Scripts
  - [ ] Adding New Scripts
- [ ] Will complete after moving scripts
- [ ] Save draft

### Day 4-5: Test Consolidated Scripts

- [ ] Create test versions of consolidated scripts
- [ ] Test build script consolidation
- [ ] Test launch script consolidation
- [ ] Test database reset consolidation
- [ ] Document any issues
- [ ] Adjust consolidation plan if needed

---

## Week 6: Root Scripts Migration

### Day 1: Archive Root Build Scripts

- [ ] Count root build scripts:
  ```bash
  ls -1 *.sh | grep -i build | wc -l
  ```
- [ ] Move to deprecated:
  ```bash
  cd /path/to/The-New-Fuse
  mv build-*.sh scripts/_deprecated/2024-q4/root-builds/
  mv comprehensive-build.sh scripts/_deprecated/2024-q4/root-builds/
  mv consolidated-build.sh scripts/_deprecated/2024-q4/root-builds/
  # ... etc
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: archive root build scripts (30+ files)"
  ```

### Day 2: Archive Root Launch Scripts

- [ ] Move launch scripts:
  ```bash
  mv launch-*.sh scripts/_deprecated/2024-q4/root-launches/
  mv dev-launch.sh scripts/_deprecated/2024-q4/root-launches/
  mv start-*.sh scripts/_deprecated/2024-q4/root-launches/
  mv run-*.sh scripts/_deprecated/2024-q4/root-launches/
  # ... etc
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: archive root launch scripts (25+ files)"
  ```

### Day 3: Archive Root Fix Scripts

- [ ] Move fix scripts:
  ```bash
  mv fix-*.sh scripts/_deprecated/2024-q4/root-fixes/
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: archive root fix scripts (80+ files)"
  ```

### Day 4: Archive Root Setup Scripts

- [ ] Move setup scripts:
  ```bash
  mv setup-*.sh scripts/_deprecated/2024-q4/root-setup/
  mv install-*.sh scripts/_deprecated/2024-q4/root-setup/
  # ... etc
  # EXCEPT setup-dev.sh if you want a convenience link
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: archive root setup scripts"
  ```

### Day 5: Archive Remaining Root Scripts

- [ ] Categorize remaining root scripts
- [ ] Move to appropriate deprecated folders or scripts/ subdirectories
- [ ] Create convenience links if desired:
  ```bash
  ln -s scripts/core/setup-dev.sh setup.sh
  ln -s scripts/launch/unified.sh launch.sh
  ```
- [ ] Verify root is clean:
  ```bash
  ls *.sh 2>/dev/null || echo "No shell scripts in root ✅"
  ```
- [ ] Commit:
  ```bash
  git add -A
  git commit -m "scripts: complete root scripts migration"
  ```

---

## Week 7: Scripts Consolidation

### Day 1: Core Scripts

- [ ] Move/create core scripts:
  ```bash
  cd scripts
  mv build.sh core/build.sh
  mv setup-dev.sh core/setup-dev.sh
  mv cleanup.sh core/clean.sh
  ```
- [ ] Create `core/dev.sh` if needed
- [ ] Test all core scripts
- [ ] Commit:
  ```bash
  git add core/
  git commit -m "scripts: consolidate core scripts"
  ```

### Day 2: Build & Launch Scripts

- [ ] Consolidate build scripts:
  ```bash
  mv production-build.sh build/production.sh
  mv build-incremental.sh build/incremental.sh
  # Create build/docker.sh
  # Create build/verify.sh
  ```
- [ ] Test build scripts
- [ ] Consolidate launch scripts:
  ```bash
  mv launch-unified.sh launch/unified.sh
  mv launch-with-services.sh launch/services.sh
  mv start-all.sh launch/all.sh
  # Create launch/frontend.sh
  ```
- [ ] Test launch scripts
- [ ] Move deprecated builds/launches:
  ```bash
  mv build-intelligent.sh _deprecated/2024-q4/
  mv launch-comprehensive.sh _deprecated/2024-q4/
  # ... etc
  ```
- [ ] Commit:
  ```bash
  git add build/ launch/ _deprecated/
  git commit -m "scripts: consolidate build and launch scripts"
  ```

### Day 3: Database & MCP Scripts

- [ ] Consolidate database reset scripts:
  ```bash
  # Merge content from 4 reset scripts into database/reset.sh
  # with flags for different modes
  ```
- [ ] Test database scripts
- [ ] Move MCP scripts:
  ```bash
  mv mcp-setup.sh mcp/setup.sh
  mv mcp-wizard.sh mcp/wizard.sh
  mv mcp-config-manager.js mcp/config-manager.js
  mv mcp-health-check.js mcp/health-check.js
  ```
- [ ] Test MCP scripts
- [ ] Archive deprecated:
  ```bash
  mv auto-mcp-config.sh _deprecated/2024-q4/
  mv auto-setup-mcp.sh _deprecated/2024-q4/
  # ... etc
  ```
- [ ] Commit:
  ```bash
  git add database/ mcp/ _deprecated/
  git commit -m "scripts: consolidate database and MCP scripts"
  ```

### Day 4: Maintenance & Fix Scripts

- [ ] Create maintenance scripts:
  ```bash
  # Consolidate cleanup scripts
  # Create maintenance/cleanup.sh
  mv clear-all-dev-ports.sh maintenance/port-cleanup.sh
  mv fix-workspace-deps.sh maintenance/fix-workspace-deps.sh
  # Create maintenance/verify-install.sh
  ```
- [ ] Test maintenance scripts
- [ ] Archive ALL fix scripts (except fix-workspace-deps):
  ```bash
  mv fix-*.sh _deprecated/2024-q4/fix-scripts/
  mv fix-*.js _deprecated/2024-q4/fix-scripts/
  # EXCEPT fix-workspace-deps.sh (already in maintenance/)
  ```
- [ ] Create README in fix-scripts/:
  ```bash
  cat > _deprecated/2024-q4/fix-scripts/README.md << 'EOF'
  # Archived Fix Scripts

  These scripts solved specific issues at specific times.
  They are archived for reference but not actively maintained.

  If you encounter a similar issue, check:
  1. scripts/maintenance/fix-workspace-deps.sh (the essential fix)
  2. These archived scripts for historical solutions
  3. Current troubleshooting docs

  ## Why Archived?

  Fix scripts are temporal - they solve a specific problem once.
  Once fixed, the solution should be integrated into the main codebase.

  ## Scripts Index

  [List each script with brief description of what it fixed]
  EOF
  ```
- [ ] Commit:
  ```bash
  git add maintenance/ _deprecated/
  git commit -m "scripts: consolidate maintenance, archive fix scripts (76→1)"
  ```

### Day 5: Complete Scripts README

- [ ] Finish writing `scripts/README.md`
- [ ] Include all active scripts with descriptions
- [ ] Add usage examples
- [ ] Add RECOMMENDED markers
- [ ] Write `scripts/_deprecated/README.md`
- [ ] Include migration guide
- [ ] Test all examples in README
- [ ] Commit:
  ```bash
  git add README.md _deprecated/README.md
  git commit -m "scripts: complete documentation"
  ```

---

## Week 8: Testing & Finalization

### Day 1-2: Documentation Validation

- [ ] Run link checker on all docs:
  ```bash
  find docs -name "*.md" -exec markdown-link-check {} \;
  ```
- [ ] Fix broken links
- [ ] Test code examples in docs
- [ ] Verify all dates updated
- [ ] Check navigation in main README
- [ ] Spot-check 20 random docs
- [ ] Get team review
- [ ] Address feedback
- [ ] Final commit:
  ```bash
  git commit -am "docs: final validation and fixes"
  ```

### Day 3: Scripts Validation

- [ ] Test all core scripts:
  ```bash
  ./scripts/core/build.sh --help
  ./scripts/core/dev.sh --help
  # ... etc
  ```
- [ ] Test all build scripts
- [ ] Test all launch scripts
- [ ] Test database scripts
- [ ] Test MCP scripts
- [ ] Test maintenance scripts
- [ ] Verify error handling in each
- [ ] Check scripts have usage docs
- [ ] Verify CI/CD still works
- [ ] Run full test suite
- [ ] Get team review
- [ ] Fix issues
- [ ] Final commit:
  ```bash
  git commit -am "scripts: final validation and fixes"
  ```

### Day 4: Create Migration Guide

- [ ] Create `MIGRATION_GUIDE.md`:
  ```markdown
  # Consolidation Migration Guide

  ## Documentation Changes

  ### If you were looking for...

  [Table mapping old → new locations]

  ### Scripts Changes

  ### If you were using...

  [Table mapping old → new scripts]

  ## Quick Reference

  [Common tasks with new commands]

  ## Questions?

  [Contact info]
  ```
- [ ] Include all key mappings
- [ ] Add examples
- [ ] Commit:
  ```bash
  git add MIGRATION_GUIDE.md
  git commit -m "docs: add migration guide for team"
  ```

### Day 5: Team Communication

- [ ] Create announcement message
- [ ] Create video walkthrough (optional)
- [ ] Schedule team Q&A meeting
- [ ] Post announcement
- [ ] Update onboarding docs
- [ ] Merge consolidation branch:
  ```bash
  git checkout main
  git merge consolidation-2024
  git push origin main
  ```
- [ ] Tag the consolidation:
  ```bash
  git tag -a consolidation-complete -m "Documentation and scripts consolidation complete"
  git push --tags
  ```
- [ ] Celebrate! 🎉

---

## Post-Consolidation

### Week 1 After Merge

- [ ] Monitor for issues
- [ ] Address team questions quickly
- [ ] Fix any broken workflows
- [ ] Update docs based on feedback
- [ ] Track success metrics

### Month 1 After Merge

- [ ] Gather team feedback
- [ ] Review metrics:
  - [ ] Onboarding time improved?
  - [ ] Docs easier to find?
  - [ ] Scripts easier to use?
- [ ] Make adjustments
- [ ] Document lessons learned

### Ongoing Maintenance

- [ ] Set up quarterly review calendar
- [ ] Add PR template check for script/doc location
- [ ] Consider CI check for scripts in root
- [ ] Update contributing guide
- [ ] Train new team members on structure

---

## Quick Command Reference

### Useful Commands During Consolidation

```bash
# Find all occurrences of a file/topic
find docs -name "*PORT*" -o -name "*port*"

# Search for broken links
grep -r "](/" docs --include="*.md"

# Count files
find docs -name "*.md" | wc -l

# Find recently modified
ls -lt scripts/*.sh | head -20

# Move multiple files
mv {file1,file2,file3} destination/

# Git mv multiple files (preserves history)
git mv source1.md destination/
git mv source2.md destination/

# Check what's in root
ls *.sh 2>/dev/null

# Test a script exists and is executable
[ -x scripts/core/build.sh ] && echo "exists and executable"

# Validate all scripts have execute permission
find scripts -name "*.sh" ! -perm -111
```

---

## Troubleshooting

### "Git won't let me move files"

```bash
# Make sure you're on the right branch
git branch

# If files are modified, commit or stash first
git status
git stash  # or git commit
```

### "Can't find a file I just moved"

```bash
# Use git log to find it
git log --all --full-history -- "**/filename.md"
```

### "Broke something, need to rollback"

```bash
# If haven't pushed yet
git reset --hard HEAD~1

# If pushed but recent
git revert HEAD

# If catastrophic
git checkout backup-pre-consolidation
```

### "Link checker failing"

```bash
# Install if missing
npm install -g markdown-link-check

# Check single file
markdown-link-check docs/README.md

# Skip external links (faster)
markdown-link-check --config .markdown-link-check.json docs/README.md
```

---

## Success Criteria

Check these when done:

### Documentation

- [ ] Only 1 file in `docs/` root (README.md)
- [ ] All port docs consolidated to 2 files
- [ ] All MCP docs consolidated to 3 files
- [ ] All development guides consolidated to 1 file
- [ ] Clear directory structure
- [ ] No broken internal links
- [ ] All docs have "Last Updated" date

### Scripts

- [ ] 0-2 scripts in project root
- [ ] 45 active scripts in scripts/
- [ ] All fix scripts archived (except 1)
- [ ] All build scripts consolidated to 4
- [ ] All launch scripts consolidated to 4
- [ ] scripts/README.md complete
- [ ] _deprecated/README.md complete

### Process

- [ ] All changes committed
- [ ] Backup branch exists
- [ ] Migration guide created
- [ ] Team informed
- [ ] Merged to main
- [ ] Tagged

---

**You've got this!** Take it one week at a time, commit frequently, and don't hesitate to ask for help.

**Full Plan:** [CONSOLIDATION_PLAN.md](./CONSOLIDATION_PLAN.md)
**Summary:** [CONSOLIDATION_SUMMARY.md](./CONSOLIDATION_SUMMARY.md)
**Comparison:** [BEFORE_AFTER_COMPARISON.md](./BEFORE_AFTER_COMPARISON.md)
