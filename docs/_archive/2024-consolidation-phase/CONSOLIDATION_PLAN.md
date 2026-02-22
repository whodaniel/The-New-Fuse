# The New Fuse - Comprehensive Consolidation Plan

**Generated:** 2025-10-23
**Project:** The New Fuse
**Scope:** Documentation and Scripts Consolidation

---

## Executive Summary

This project has experienced significant organic growth, resulting in:
- **431 script files** (274 .sh files in scripts/ root alone, 200+ in project root)
- **~200+ documentation files** across 68 directories
- **76 "fix-*" scripts** addressing various issues
- **23 root-level docs** requiring better organization
- **8 _archive directories** with historical content
- **~11,847 lines** of shell scripts in project root alone

**Key Issues:**
1. Massive duplication of build, launch, and fix scripts
2. Documentation scattered across overlapping directories (development/ vs development-and-troubleshooting/)
3. Multiple versions of the same guides (PORT_MANAGEMENT appears in 5+ locations)
4. Scripts in both root and scripts/ directories creating confusion
5. MCP documentation spread across 14+ files
6. No clear entry point for new developers

---

## Part 1: Documentation Consolidation

### Current Structure Analysis

```
docs/
├── 23 root-level .md files (GETTING_STARTED.md, DEVELOPMENT.md, etc.)
├── 68 subdirectories
├── Multiple overlapping categories:
│   ├── development/ (196K)
│   ├── development-and-troubleshooting/ (192K) ← DUPLICATE
│   ├── guides/ (264K)
│   ├── troubleshooting/ (with _archive/)
│   ├── project/ (272K)
│   ├── project-management/ (380K) ← OVERLAP
│   └── project-planning/ (104K) ← OVERLAP
└── 8 _archive/ directories (39 archived files total)
```

### Proposed New Structure

```
docs/
├── README.md (Master index, completely rewritten)
│
├── getting-started/
│   ├── README.md (Quick start guide)
│   ├── installation.md (Already exists)
│   ├── quick-start.md (Already exists)
│   ├── prerequisites.md (NEW - extract from GETTING_STARTED.md)
│   └── first-steps.md (NEW - consolidate beginner content)
│
├── guides/
│   ├── README.md (Index of all guides)
│   ├── development.md (Merge DEVELOPMENT.md + guides/development.md)
│   ├── testing.md (TESTING_GUIDE.md moved here)
│   ├── deployment.md (Consolidate deployment guides)
│   ├── agent-communication.md (COMPLETE-AGENT-COMMUNICATION-GUIDE.md)
│   ├── mcp-integration.md (Consolidate all MCP guides)
│   ├── docker-setup.md
│   ├── build-optimization.md (BUILD_OPTIMIZATION.md)
│   └── pnpm-workspace.md (pnpm-optimization-guide.md)
│
├── reference/
│   ├── README.md
│   ├── api/ (Keep existing structure)
│   ├── protocols/ (Keep, but consolidate MCP specs)
│   ├── architecture/
│   │   ├── overview.md (NEW)
│   │   ├── port-management.md (CONSOLIDATE all port docs)
│   │   ├── agent-system.md
│   │   └── vector-database.md (VECTOR_DATABASE_HARMONIZATION.md)
│   ├── components/ (Keep existing)
│   └── specifications/ (Clean up _archive/)
│
├── troubleshooting/
│   ├── README.md (Index with common issues)
│   ├── general.md (Consolidate TROUBLESHOOTING_GUIDE.md)
│   ├── mcp.md (Consolidate MCP_TROUBLESHOOTING_GUIDE.md)
│   ├── port-management.md (Consolidate 3 port troubleshooting docs)
│   ├── frontend.md (FRONTEND-TROUBLESHOOTING.md)
│   ├── typescript.md (typescript-fix-report.md, typescript-esm-fix-log.md)
│   └── common-errors.md (NEW)
│
├── project/
│   ├── README.md
│   ├── overview.md (Consolidate project-overview.md)
│   ├── roadmap.md
│   ├── architecture.md
│   ├── decisions/ (Architecture Decision Records)
│   └── migrations/ (Migration guides)
│
├── automation/ (Keep existing - ROO_AGENT_AUTOMATION_README.md)
├── chrome-extension/ (Keep existing structure)
├── database/ (Keep existing structure)
├── integrations/ (Keep existing)
├── deployment/ (Keep existing)
│
└── _archive/
    ├── 2024-pre-restructure/ (Move old docs here)
    ├── deprecated-guides/
    ├── implementation-logs/ (DEVELOPMENT_PROGRESS_LOG.md, etc.)
    └── README.md (What's here and why)
```

### Documentation Consolidation Actions

#### Phase 1: Merge Duplicate Guides

**1. Port Management Documentation (Priority: HIGH)**
- **Files to Consolidate (5 total):**
  - `/docs/PORT_MANAGEMENT.md`
  - `/docs/PORT_MANAGEMENT_ARCHITECTURE.md`
  - `/docs/PORT-MAPPING.md`
  - `/docs/development-and-troubleshooting/PORT_MANAGEMENT.md`
  - `/docs/development-and-troubleshooting/PORT_MANAGEMENT_QUICK_REFERENCE.md`
  - `/docs/development/PORT-CONFIGURATION.md`
  - `/docs/troubleshooting/PORT-MANAGEMENT-SOLUTION.md`
  - `/docs/troubleshooting/PORT-MANAGEMENT-STATUS.md`

- **Consolidate to:**
  - `/docs/reference/architecture/port-management.md` (Complete technical reference)
  - `/docs/troubleshooting/port-management.md` (Common issues & solutions)

- **Action:** Extract all unique content, merge chronologically, preserve all technical details

**2. MCP Documentation (Priority: HIGH)**
- **Files to Consolidate (14 total):**
  - `/docs/MCP-COMPLETE-API-WRAPPING.md`
  - `/docs/MCP_TROUBLESHOOTING_GUIDE.md`
  - `/docs/guides/MCP-INTEGRATION-GUIDE-component-analysis.md`
  - `/docs/protocols/MCP-COMPLETE-GUIDE.md`
  - `/docs/troubleshooting/MCP-TROUBLESHOOTING-COMPLETE.md`
  - `/docs/specifications/_archive/MCP*.md` (7 files)

- **Consolidate to:**
  - `/docs/guides/mcp-integration.md` (How to integrate MCP)
  - `/docs/reference/protocols/mcp-specification.md` (Technical spec)
  - `/docs/troubleshooting/mcp.md` (Common issues)

- **Archive:** Keep `specifications/_archive/` but add README explaining history

**3. Development Guides (Priority: HIGH)**
- **Files to Consolidate:**
  - `/docs/DEVELOPMENT.md`
  - `/docs/guides/development.md`
  - `/docs/concepts/workflow/current/DEVELOPMENT.md`

- **Consolidate to:**
  - `/docs/guides/development.md` (Single, comprehensive guide)

**4. Getting Started (Priority: HIGH)**
- **Files to Consolidate:**
  - `/docs/GETTING_STARTED.md`
  - `/docs/extensions/getting-started.md`
  - `/docs/development-and-troubleshooting/QUICK_START_REORGANIZATION.md`

- **Consolidate to:**
  - `/docs/getting-started/README.md` (Main quick start)
  - `/docs/getting-started/prerequisites.md`
  - `/docs/guides/extensions.md` (Extension-specific content)

**5. Troubleshooting Guides (Priority: MEDIUM)**
- **Consolidate:**
  - All files from `/docs/development-and-troubleshooting/` (22 files)
  - Organize into `/docs/troubleshooting/` by topic
  - Archive implementation logs to `_archive/implementation-logs/`

**6. Project Management Docs (Priority: MEDIUM)**
- **Merge directories:**
  - `/docs/project/` (272K, 29 files)
  - `/docs/project-management/` (380K)
  - `/docs/project-planning/` (104K)

- **Consolidate to:**
  - `/docs/project/` (Keep this as primary)
  - Move planning docs to `/docs/project/planning/`
  - Move old management docs to `_archive/`

#### Phase 2: Archive Old Content

**Archive to `/docs/_archive/2024-pre-restructure/`:**
- Implementation logs (DEVELOPMENT_PROGRESS_LOG.md, CLAUDE_DEV_IMPLEMENTATION_LOG.md)
- Session handoffs (NEXT_SESSION_HANDOFF.md)
- Temporary analysis files (CRITICAL-FRONTEND-ANALYSIS.md)
- Old TODO lists (TODO_CHECKLIST.md)
- Migration summaries (REACT_AIRTABLE_CLONE_MIGRATION_SUMMARY.md)
- Old checklists (DEPLOYMENT_CHECKLIST.md)

**Archive to `/docs/_archive/deprecated-guides/`:**
- Outdated integration READMEs
- Old quick start guides that have been superseded
- Deprecated agent communication protocols

#### Phase 3: Create Missing Documentation

**New files to create:**
1. `/docs/README.md` - Complete rewrite with clear navigation
2. `/docs/getting-started/prerequisites.md` - Extract from scattered sources
3. `/docs/troubleshooting/common-errors.md` - Consolidate common issues
4. `/docs/reference/architecture/overview.md` - High-level architecture
5. `/docs/_archive/README.md` - Explain what's archived and why

### Documentation Quality Standards

**All consolidated docs must:**
1. Include a "Last Updated" date
2. Reference source files in a footer comment
3. Remove duplicate information
4. Use consistent heading hierarchy
5. Include a table of contents for docs >200 lines
6. Link to related docs in "See Also" section
7. Follow the project's markdown style guide

---

## Part 2: Scripts Consolidation

### Current Scripts Analysis

**Statistics:**
- **Project Root:** 200+ .sh files (~11,847 lines of code)
- **scripts/ directory:** 274 shell scripts + 157 JavaScript files = 431 total
- **Deprecated already:** 13 scripts in `deprecated-build-scripts/`
- **Fix scripts:** 76 different fix-*.sh and fix-*.js files
- **Launch scripts:** 12+ different launch variations
- **Build scripts:** 14+ different build variations
- **MCP scripts:** 5+ MCP setup/config scripts
- **Cleanup scripts:** 6+ cleanup variations
- **Database scripts:** 11+ database/Drizzle scripts

### Critical Issue: Script Location Chaos

**Problem:** Scripts exist in TWO locations:
1. Project root: 200+ scripts (unmaintainable)
2. `/scripts/`: 431 scripts (better but still chaotic)

**Impact:**
- Developers don't know which scripts to use
- Old scripts in root may conflict with newer scripts/
- No clear versioning or progression
- Difficult to maintain or update

### Proposed Scripts Structure

```
scripts/
├── README.md (Complete index with descriptions)
│
├── core/ (Essential scripts used by build system)
│   ├── build.sh (Single source of truth)
│   ├── dev.sh (Single development launcher)
│   ├── clean.sh (Workspace cleanup)
│   └── setup-dev.sh (Initial setup)
│
├── build/
│   ├── production.sh (production-build.sh)
│   ├── incremental.sh (build-incremental.sh)
│   ├── docker.sh (Consolidate docker build scripts)
│   └── verify.sh (Build verification)
│
├── launch/
│   ├── unified.sh (launch-unified.sh - RECOMMENDED)
│   ├── frontend.sh (For frontend-only dev)
│   ├── services.sh (launch-with-services.sh)
│   └── all.sh (Complete system launch)
│
├── database/
│   ├── reset.sh (Consolidate 4 reset scripts)
│   ├── migrate.sh
│   ├── seed.sh
│   └── init.sql/
│
├── mcp/
│   ├── setup.sh (mcp-setup.sh)
│   ├── wizard.sh (mcp-wizard.sh)
│   ├── config-manager.js
│   └── health-check.js
│
├── deployment/
│   ├── deploy-production.sh
│   ├── deploy-monitoring.sh
│   └── (keep existing structure)
│
├── maintenance/
│   ├── cleanup.sh (Master cleanup)
│   ├── port-cleanup.sh (Port management)
│   ├── fix-workspace-deps.sh (Dependency fixer)
│   └── verify-install.sh
│
├── development/
│   ├── analyze-dependencies.js
│   ├── check-health.sh
│   └── monitor.sh
│
├── testing/
│   ├── run-tests.sh
│   ├── integration-test.js
│   └── validate.sh
│
├── utilities/ (Helper scripts)
│   ├── common/
│   │   └── logging.sh (Keep existing)
│   ├── parsers/
│   └── validation/
│
└── _deprecated/ (Archive old scripts)
    ├── 2024-q4/
    │   ├── fix-scripts/ (Archive all 76 fix-* scripts here)
    │   ├── old-builds/
    │   ├── old-launches/
    │   └── experimental/
    └── README.md (What was deprecated and why)
```

### Scripts Consolidation Actions

#### Phase 1: Identify Active vs Deprecated Scripts

**Scripts ACTIVELY USED (Keep in core/):**
Based on:
- Referenced in package.json
- Modified in last 7 days (Oct 23, 2023)
- Referenced in turbo.json
- Part of CI/CD pipeline

**Recently Modified (Keep):**
1. `start-all.sh` (Oct 23)
2. `setup-claude-dev-automation.sh` (Oct 23)
3. `production-build.sh` (Oct 23)
4. `launch-unified.sh` (Oct 23)
5. `fix-workspace-deps.sh` (Oct 23)
6. `fix-react-app.sh` (Oct 23)
7. `consolidate-frontend.sh` (Oct 23)
8. `build.sh` (Oct 23)
9. `cleanup.sh` (Oct 23)
10. `setup-dev.sh` (Oct 23)

**Referenced in Package.json (Implicitly Used):**
- None directly (uses turbo/pnpm commands)
- BUT: Common pattern is developers run scripts/ directly

**Scripts to DEPRECATE (Move to _deprecated/):**

**1. Fix Scripts (76 files - ARCHIVE ALL):**
These are one-time fixes that should be archived:
- All `fix-*.sh` and `fix-*.js` in both root and scripts/
- Reasoning: Fix scripts are temporal - they solve a specific problem at a point in time
- Action: Move to `_deprecated/2024-q4/fix-scripts/` with README explaining what each fixed
- **Exception:** Keep `fix-workspace-deps.sh` (still actively used)

**2. Duplicate Build Scripts:**
- **Root Directory:** All build-*.sh files (30+ files)
  - Move to `_deprecated/2024-q4/old-builds/`
  - Keep only: `scripts/build/production.sh`, `scripts/core/build.sh`

- **scripts/ duplicates:**
  - `build-and-launch.sh` (use launch/ scripts instead)
  - `build-chrome-*.sh` (consolidate to one)
  - `build-vscode-*.sh` (consolidate to one)
  - `build-with-memory-optimization.sh` (integrate into main build)
  - `build-intelligent.sh` (merge features into main build)
  - All in `deprecated-build-scripts/` (already identified)

**3. Duplicate Launch Scripts:**
Current: 12 launch variations
- **Keep:**
  - `launch-unified.sh` (PRIMARY - most comprehensive)
  - `launch-with-services.sh` (for service-only dev)
  - `scripts/launch/frontend.sh` (frontend-only dev)

- **Deprecate:**
  - `launch-comprehensive.sh` (redundant with unified)
  - `launch-streamlined.sh` (redundant)
  - `launch-electron-standalone.sh` (niche, archive)
  - `launch-functional-browser.sh` (redundant)
  - `launch-mcp-wizard.sh` (move to mcp/)
  - `launch-the-new-fuse.sh` (redundant)
  - `launch-ide-standalone.sh` (niche, archive)
  - `launch-trae.sh` (what is this?)
  - `launch.sh` (too generic)
  - `launch-prod.sh` (rename to production.sh)

**4. Database Scripts:**
- **Keep (Consolidate to 4 scripts):**
  - `database/reset.sh` (merge reset-database.sh, reset-db-simple.sh, reset-drizzle-db.sh, reset-drizzle-db-with-password.sh)
  - `database/migrate.sh`
  - `database/seed.sh`
  - `database/init.sql/` (directory)

- **Deprecate:**
  - All individual reset-*.sh variants (11 scripts)
  - `deprecated-build-scripts/build-bypass-db.sh`
  - `deprecated-build-scripts/build-skip-db-migrate.sh`

**5. Cleanup Scripts:**
- **Keep:**
  - `cleanup.sh` (master cleanup)
  - Move to `scripts/maintenance/cleanup.sh`

- **Deprecate:**
  - `cleanup-deprecated.sh` (run once then archive)
  - `cleanup-dev-artifacts.sh` (merge into main)
  - `cleanup-git-status.sh` (one-time)
  - `cleanup-js-files.sh` (one-time)
  - `cleanup-redundant-scripts.sh` (ironic!)

**6. MCP Scripts:**
- **Keep:**
  - `mcp-setup.sh`
  - `mcp-wizard.sh`
  - `mcp-config-manager.js`
  - `mcp-health-check.js`

- **Deprecate:**
  - `auto-mcp-config.sh` (merge into mcp-setup)
  - `auto-setup-mcp.sh` (redundant)
  - All `run-copilot-mcp-*.sh` variants

#### Phase 2: Consolidate Root Directory Scripts

**CRITICAL:** Move ALL scripts from root to `/scripts/`

**Current Root Scripts by Category:**

**Build Scripts (30+):** → `scripts/_deprecated/2024-q4/root-builds/`
- All `build-*.sh`, `comprehensive-build.sh`, `consolidated-build.sh`, etc.

**Launch Scripts (25+):** → `scripts/_deprecated/2024-q4/root-launches/`
- All `launch-*.sh`, `run-*.sh`, `start-*.sh`
- Exception: `start-all.sh` → move to `scripts/launch/all.sh`

**Fix Scripts (80+):** → `scripts/_deprecated/2024-q4/root-fixes/`
- All `fix-*.sh` files from root

**Setup Scripts (15+):** → Keep only essential
- `setup.sh` → merge into `scripts/core/setup-dev.sh`
- `install-deps.sh` → merge into `scripts/core/setup-dev.sh`
- Others → `scripts/_deprecated/2024-q4/root-setup/`

**Docker Scripts (15+):** → Consolidate
- Keep: `scripts/deployment/docker-build.sh` (consolidate all)
- Deprecate: All individual `docker-*.sh` files

**Test Scripts:** → `scripts/testing/`
- `run-tests.sh` → `scripts/testing/run-tests.sh`
- `test-*.sh` → `scripts/testing/`

**Utility Scripts:** → Various
- `cleanup.sh` → `scripts/maintenance/cleanup.sh`
- `status.sh` → `scripts/development/status.sh`
- `verify-*.sh` → `scripts/maintenance/`

#### Phase 3: Create Master Scripts README

Create `/scripts/README.md` with:

```markdown
# Scripts Directory

## Quick Start

For most development tasks:
- `pnpm dev` - Start development environment
- `pnpm build` - Build all packages
- `pnpm clean` - Clean workspace

## Core Scripts (scripts/core/)

These are the essential scripts you'll use daily:

| Script | Purpose | Usage |
|--------|---------|-------|
| `build.sh` | Build entire project | `./scripts/core/build.sh` |
| `dev.sh` | Start dev environment | `./scripts/core/dev.sh` |
| `clean.sh` | Clean build artifacts | `./scripts/core/clean.sh` |
| `setup-dev.sh` | Initial setup | `./scripts/core/setup-dev.sh` |

## Specialized Scripts

### Build Scripts (scripts/build/)
- `production.sh` - Production build with optimizations
- `incremental.sh` - Incremental build (faster)
- `docker.sh` - Build Docker images
- `verify.sh` - Verify build integrity

### Launch Scripts (scripts/launch/)
- **RECOMMENDED:** `unified.sh` - Complete system (frontend + backend + services)
- `frontend.sh` - Frontend development only
- `services.sh` - Backend services only
- `all.sh` - Everything (most comprehensive)

### Database Scripts (scripts/database/)
- `reset.sh` - Reset database (drops and recreates)
- `migrate.sh` - Run migrations
- `seed.sh` - Seed development data

### MCP Scripts (scripts/mcp/)
- `setup.sh` - Configure MCP servers
- `wizard.sh` - Interactive MCP setup
- `health-check.js` - Check MCP server health

### Maintenance (scripts/maintenance/)
- `cleanup.sh` - Clean all caches and temp files
- `port-cleanup.sh` - Kill processes on dev ports
- `fix-workspace-deps.sh` - Fix dependency issues
- `verify-install.sh` - Verify installation

### Development (scripts/development/)
- `analyze-dependencies.js` - Analyze package dependencies
- `check-health.sh` - System health check
- `monitor.sh` - Monitor running processes

## Deprecated Scripts

Old scripts are in `scripts/_deprecated/` for reference.
See `scripts/_deprecated/README.md` for migration guide.

## Script Naming Conventions

- `*.sh` - Shell scripts (Bash)
- `*.js` - Node.js scripts
- `*.ts` - TypeScript scripts (compiled before use)

## Adding New Scripts

1. Determine category (core, build, launch, etc.)
2. Place in appropriate directory
3. Add execute permissions: `chmod +x script.sh`
4. Update this README
5. Add description comment at top of script
```

#### Phase 4: Create Deprecation Guide

Create `/scripts/_deprecated/README.md`:

```markdown
# Deprecated Scripts

This directory contains scripts that are no longer actively maintained but kept for reference.

## Why Scripts Are Deprecated

Scripts are moved here when:
1. They solve a one-time problem (fix scripts)
2. They've been superseded by better implementations
3. They're experimental and didn't work out
4. They're duplicates of existing functionality

## Migration Guide

### If you were using...

#### Build Scripts
- `build-intelligent.sh` → Use `pnpm build` or `scripts/core/build.sh`
- `build-with-memory-optimization.sh` → Now built into main build.sh
- Any `build-*.sh` → Use `scripts/core/build.sh` with flags

#### Launch Scripts
- `launch-comprehensive.sh` → Use `scripts/launch/unified.sh`
- `launch-streamlined.sh` → Use `scripts/launch/unified.sh`
- Any `launch-*.sh` → Use `scripts/launch/unified.sh` (recommended)

#### Database Scripts
- `reset-database.sh` → Use `scripts/database/reset.sh`
- `reset-drizzle-db*.sh` → Use `scripts/database/reset.sh`

#### Fix Scripts
- `fix-*.sh` → These were one-time fixes. See individual script for context.
- If issue recurs, integrate fix into main codebase

## Directory Structure

- `2024-q4/` - Scripts deprecated in Q4 2024
  - `fix-scripts/` - One-time fix scripts (76 files)
  - `old-builds/` - Superseded build scripts
  - `old-launches/` - Superseded launch scripts
  - `root-scripts/` - Scripts moved from project root

## Need Help?

If you need functionality from a deprecated script:
1. Check if it's been integrated into active scripts
2. Check git history to see why it was deprecated
3. Ask in #development channel
```

### Scripts Consolidation Summary

**Files to Move:**
- **Root → scripts/_deprecated/**: ~170 files
- **scripts/ → scripts/_deprecated/**: ~200 files
- **Total deprecated:** ~370 scripts (85% of total!)

**Files to Keep (Active):**
- **Core scripts:** 4 files
- **Build scripts:** 4 files
- **Launch scripts:** 4 files
- **Database scripts:** 4 files
- **MCP scripts:** 4 files
- **Maintenance:** 4 files
- **Development:** 3 files
- **Testing:** 3 files
- **Deployment:** ~10 files (keep existing)
- **Utilities:** ~5 files (keep existing structure)
- **Total active:** ~45 scripts (10% of total)

**Reduction:** From 431 scripts → 45 active scripts (90% reduction!)

---

## Part 3: Implementation Plan

### Phase 1: Preparation (Do NOT Execute Yet)

**Week 1: Documentation Audit**
- [ ] Review all PORT_MANAGEMENT*.md files, extract unique content
- [ ] Review all MCP*.md files, extract unique content
- [ ] Review all DEVELOPMENT*.md files, extract unique content
- [ ] Create content matrix showing what's in each file
- [ ] Identify 100% duplicate content vs unique content

**Week 1: Scripts Audit**
- [ ] Run `git log --follow` on top 50 scripts to see usage history
- [ ] Check which scripts are called by CI/CD
- [ ] Check which scripts are referenced in documentation
- [ ] Create dependency graph (which scripts call which)
- [ ] Test top 20 active scripts to ensure they still work

### Phase 2: Documentation Consolidation

**Week 2: High-Priority Doc Merges**
1. **Port Management** (Day 1-2)
   - Merge 8 files → 2 files
   - Validate all port numbers are consistent
   - Test all examples

2. **MCP Documentation** (Day 3-4)
   - Merge 14 files → 3 files
   - Ensure all examples are current
   - Update configuration samples

3. **Development Guides** (Day 5)
   - Merge 3 files → 1 file
   - Update setup instructions
   - Test setup on clean machine

**Week 3: Medium-Priority Doc Merges**
4. **Getting Started** (Day 1)
5. **Troubleshooting** (Day 2-3)
6. **Project Management** (Day 4-5)

**Week 4: Cleanup & New Content**
7. Create new README.md
8. Create missing architecture docs
9. Archive old content
10. Update all cross-references

### Phase 3: Scripts Consolidation

**Week 5: Deprecation Preparation**
1. Create `scripts/_deprecated/` structure
2. Create deprecation README
3. Create migration guide
4. Test new consolidated scripts

**Week 6: Root Scripts Migration**
1. Move root scripts to `_deprecated/2024-q4/root-scripts/`
2. Keep only essential links in root (if any)
3. Update any documentation references
4. Test that builds still work

**Week 7: Scripts/ Consolidation**
1. Move deprecated scripts to `_deprecated/`
2. Create consolidated core scripts
3. Create scripts/README.md
4. Update all documentation

**Week 8: Testing & Validation**
1. Test all active scripts
2. Ensure CI/CD still works
3. Update developer documentation
4. Create migration guide for team

### Phase 4: Validation

**Documentation Validation:**
- [ ] All internal links work
- [ ] No broken references to moved files
- [ ] All code examples are current
- [ ] Each doc has "Last Updated" date
- [ ] README navigation is complete
- [ ] Search still works (if applicable)

**Scripts Validation:**
- [ ] All active scripts execute without errors
- [ ] Scripts have proper error handling
- [ ] Scripts have usage documentation
- [ ] CI/CD pipeline still works
- [ ] Development workflow unaffected
- [ ] Deprecated scripts are clearly marked

### Phase 5: Communication

**Before Starting:**
- [ ] Post consolidation plan to team channel
- [ ] Get stakeholder approval
- [ ] Schedule "freeze" period if needed
- [ ] Create backup branch

**During Consolidation:**
- [ ] Daily progress updates
- [ ] Document any issues discovered
- [ ] Keep team informed of changes

**After Completion:**
- [ ] Post migration guide
- [ ] Update onboarding docs
- [ ] Host Q&A session for team
- [ ] Create video walkthrough (optional)

---

## Part 4: Detailed File Mapping

### Documentation File Mapping

#### Port Management Consolidation

| Source File | Destination | Action | Notes |
|------------|-------------|--------|-------|
| `/docs/PORT_MANAGEMENT.md` | `/docs/reference/architecture/port-management.md` | Merge | Take technical specs |
| `/docs/PORT_MANAGEMENT_ARCHITECTURE.md` | `/docs/reference/architecture/port-management.md` | Merge | Take architecture details |
| `/docs/PORT-MAPPING.md` | `/docs/reference/architecture/port-management.md` | Merge | Take port table |
| `/docs/development-and-troubleshooting/PORT_MANAGEMENT.md` | `/docs/reference/architecture/port-management.md` | Merge | Check for unique content |
| `/docs/development-and-troubleshooting/PORT_MANAGEMENT_QUICK_REFERENCE.md` | `/docs/reference/architecture/port-management.md` | Merge | Add as quick reference section |
| `/docs/development/PORT-CONFIGURATION.md` | `/docs/reference/architecture/port-management.md` | Merge | Take configuration details |
| `/docs/troubleshooting/PORT-MANAGEMENT-SOLUTION.md` | `/docs/troubleshooting/port-management.md` | Merge | Solutions section |
| `/docs/troubleshooting/PORT-MANAGEMENT-STATUS.md` | `/docs/_archive/` | Archive | Historical status |

#### MCP Documentation Consolidation

| Source File | Destination | Action | Notes |
|------------|-------------|--------|-------|
| `/docs/MCP-COMPLETE-API-WRAPPING.md` | `/docs/guides/mcp-integration.md` | Merge | API integration guide |
| `/docs/MCP_TROUBLESHOOTING_GUIDE.md` | `/docs/troubleshooting/mcp.md` | Merge | Troubleshooting |
| `/docs/guides/MCP-INTEGRATION-GUIDE-component-analysis.md` | `/docs/guides/mcp-integration.md` | Merge | Component analysis |
| `/docs/protocols/MCP-COMPLETE-GUIDE.md` | `/docs/guides/mcp-integration.md` | Merge | Complete guide content |
| `/docs/troubleshooting/MCP-TROUBLESHOOTING-COMPLETE.md` | `/docs/troubleshooting/mcp.md` | Merge | Complete troubleshooting |
| `/docs/specifications/_archive/MCP-SPECIFICATION.md` | `/docs/reference/protocols/mcp-specification.md` | Merge | Keep spec in archive, link from reference |
| `/docs/specifications/_archive/MCP_SPECIFICATION.md` | `/docs/reference/protocols/mcp-specification.md` | Merge | Duplicate, merge |
| `/docs/specifications/_archive/MCP-TASKS-REFERENCE.md` | `/docs/reference/protocols/mcp-specification.md` | Merge | Add as appendix |
| `/docs/specifications/_archive/MCP_SERVER_DOCUMENTATION.md` | `/docs/guides/mcp-integration.md` | Merge | Server setup section |
| `/docs/specifications/_archive/MCP_TROUBLESHOOTING.md` | `/docs/troubleshooting/mcp.md` | Merge | Additional troubleshooting |
| `/docs/specifications/_archive/EXTENDING_MCP_SERVER.md` | `/docs/guides/mcp-integration.md` | Merge | Extension guide |
| `/docs/specifications/_archive/COMPLETE-MCP-SPECIFICATIONS.md` | `/docs/reference/protocols/mcp-specification.md` | Merge | Complete spec |
| `/docs/protocols/_archive/MCP-*.md` (4 files) | Keep in archive | Archive | Add README explaining history |

#### Development Guides Consolidation

| Source File | Destination | Action | Notes |
|------------|-------------|--------|-------|
| `/docs/DEVELOPMENT.md` | `/docs/guides/development.md` | Merge | Primary content |
| `/docs/guides/development.md` | `/docs/guides/development.md` | Merge | Already destination |
| `/docs/concepts/workflow/current/DEVELOPMENT.md` | `/docs/guides/development.md` | Merge | Workflow-specific content |

#### Root Documentation Files

| Source File | Destination | Action | Notes |
|------------|-------------|--------|-------|
| `/docs/GETTING_STARTED.md` | `/docs/getting-started/README.md` | Merge | Main quick start |
| `/docs/TESTING_GUIDE.md` | `/docs/guides/testing.md` | Move | Testing guide |
| `/docs/BUILD_OPTIMIZATION.md` | `/docs/guides/build-optimization.md` | Move | Build guide |
| `/docs/pnpm-optimization-guide.md` | `/docs/guides/pnpm-workspace.md` | Move | Workspace guide |
| `/docs/VECTOR_DATABASE_HARMONIZATION.md` | `/docs/reference/architecture/vector-database.md` | Move | Architecture doc |
| `/docs/AGENT-COMMUNICATION-GUIDE.md` | `/docs/guides/agent-communication.md` | Move | Communication guide |
| `/docs/AGENT_COMMUNICATION_PROTOCOL.md` | `/docs/guides/agent-communication.md` | Merge | Merge with above |
| `/docs/API-GATEWAY-IMPLEMENTATION.md` | `/docs/reference/api/gateway.md` | Move | API reference |
| `/docs/AVAILABLE_AGENTS_REGISTRY.md` | `/docs/reference/agents/registry.md` | Move | Agent reference |
| `/docs/CLEANUP_GUIDE.md` | `/docs/guides/maintenance.md` | Move | Maintenance guide |
| `/docs/DOCUMENTATION-ORGANIZATION-SUMMARY.md` | `/docs/_archive/` | Archive | Historical |
| `/docs/ENHANCED-MCP-CONFIG-MANAGER.md` | `/docs/guides/mcp-integration.md` | Merge | MCP config section |
| `/docs/IMPLEMENTATION-PLAN.md` | `/docs/_archive/` | Archive | Historical |
| `/docs/IMPLEMENTATION-SUMMARY.md` | `/docs/_archive/` | Archive | Historical |
| `/docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md` | `/docs/reference/protocols/orchestrator.md` | Move | Protocol reference |
| `/docs/REACT_AIRTABLE_CLONE_MIGRATION_SUMMARY.md` | `/docs/_archive/` | Archive | Historical migration |
| `/docs/claude-ping-controller-unified-docs.md` | `/docs/reference/automation/claude-ping.md` | Move | Automation reference |
| `/docs/ping-system-expansion-plan.md` | `/docs/project/planning/` | Move | Planning doc |
| `/docs/tnf-tmux-setup-guide.md` | `/docs/guides/tmux-setup.md` | Move | Setup guide |
| `/docs/index.md` | `/docs/README.md` | Merge | Consolidate into main README |
| `/docs/ROO_AGENT_AUTOMATION_README.md` | `/docs/automation/README.md` | Move | Already in right place |

#### Development and Troubleshooting Directory

**All 22 files from `/docs/development-and-troubleshooting/`:**

| Source File | Destination | Action |
|------------|-------------|--------|
| `CLAUDE_DEV_IMPLEMENTATION_LOG.md` | `/docs/_archive/implementation-logs/` | Archive |
| `CLAUDE_PING_RESEARCH_DOCUMENTATION.md` | `/docs/reference/automation/claude-ping-research.md` | Move |
| `CRITICAL-FRONTEND-ANALYSIS.md` | `/docs/_archive/` | Archive |
| `DEPLOYMENT_CHECKLIST.md` | `/docs/guides/deployment.md` | Merge as checklist section |
| `DEVELOPMENT_PROGRESS_LOG.md` | `/docs/_archive/implementation-logs/` | Archive |
| `GIT_RECONCILIATION_GUIDE.md` | `/docs/guides/git-workflow.md` | Move |
| `INTEGRATION_README.md` | `/docs/guides/integration.md` | Move |
| `MANUAL_SELECTION_PANEL_FIX.md` | `/docs/_archive/fixes/` | Archive |
| `MASS_INTEGRATION.md` | `/docs/_archive/` | Archive |
| `NEXT_SESSION_HANDOFF.md` | `/docs/_archive/` | Archive |
| `PORT_CONFIGURATION.md` | Merge into port-management.md | Merge |
| `PORT_MANAGEMENT.md` | Merge into port-management.md | Merge |
| `PORT_MANAGEMENT_QUICK_REFERENCE.md` | Merge into port-management.md | Merge |
| `PRODUCTION_READY_SITEMAP.md` | `/docs/project/sitemap.md` | Move |
| `QUICK_START_REORGANIZATION.md` | `/docs/_archive/` | Archive |
| `QWEN_INTEGRATION_README.md` | `/docs/integrations/qwen.md` | Move |
| `Reset-Safe.md` | `/docs/troubleshooting/database-reset.md` | Move |
| `TNF_RELAY_INTEGRATION_COMPLETE.md` | `/docs/integrations/tnf-relay.md` | Move |
| `TNF_RELAY_INTEGRATION_STATUS.md` | `/docs/_archive/` | Archive |
| `TODO_CHECKLIST.md` | `/docs/_archive/` | Archive |
| `TROUBLESHOOTING_GUIDE.md` | `/docs/troubleshooting/general.md` | Move |
| `verify-mcp-fix.md` | `/docs/_archive/fixes/` | Archive |

### Scripts File Mapping

#### Core Scripts (Keep Active)

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/build.sh` | `scripts/core/build.sh` | Move |
| `scripts/setup-dev.sh` | `scripts/core/setup-dev.sh` | Move |
| `scripts/cleanup.sh` | `scripts/core/clean.sh` | Rename |
| New file needed | `scripts/core/dev.sh` | Create - consolidate dev scripts |

#### Build Scripts

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/production-build.sh` | `scripts/build/production.sh` | Move |
| `scripts/build-incremental.sh` | `scripts/build/incremental.sh` | Move |
| `scripts/docker-build.sh` | `scripts/build/docker.sh` | Move |
| `scripts/comprehensive-build-validation.sh` | `scripts/build/verify.sh` | Move |
| `scripts/build-intelligent.sh` | `scripts/_deprecated/` | Deprecate - features merged to core |
| `scripts/build-with-memory-optimization.sh` | `scripts/_deprecated/` | Deprecate - now default |
| `scripts/build-*.sh` (11 others) | `scripts/_deprecated/2024-q4/builds/` | Deprecate |

#### Launch Scripts

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/launch-unified.sh` | `scripts/launch/unified.sh` | Move - RECOMMENDED |
| `scripts/launch-with-services.sh` | `scripts/launch/services.sh` | Move |
| `scripts/start-all.sh` | `scripts/launch/all.sh` | Move |
| New file needed | `scripts/launch/frontend.sh` | Create - consolidate frontend launches |
| `scripts/launch-comprehensive.sh` | `scripts/_deprecated/` | Deprecate - use unified.sh |
| `scripts/launch-*.sh` (8 others) | `scripts/_deprecated/2024-q4/launches/` | Deprecate |

#### Database Scripts

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/reset-database.sh` | Base for consolidated | Merge |
| `scripts/reset-db-simple.sh` | Merge to reset.sh | Merge |
| `scripts/reset-drizzle-db.sh` | Merge to reset.sh | Merge |
| `scripts/reset-drizzle-db-with-password.sh` | Merge to reset.sh | Merge |
| Consolidated output | `scripts/database/reset.sh` | Create |
| Existing | `scripts/database/` (other files) | Keep |

#### MCP Scripts

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/mcp-setup.sh` | `scripts/mcp/setup.sh` | Move |
| `scripts/mcp-wizard.sh` | `scripts/mcp/wizard.sh` | Move |
| `scripts/mcp-config-manager.js` | `scripts/mcp/config-manager.js` | Move |
| `scripts/mcp-health-check.js` | `scripts/mcp/health-check.js` | Move |
| `scripts/auto-mcp-config.sh` | `scripts/_deprecated/` | Deprecate - features in setup.sh |
| `scripts/auto-setup-mcp.sh` | `scripts/_deprecated/` | Deprecate |
| `scripts/initialize-mcp*.sh/js` | `scripts/_deprecated/` | Deprecate |
| `scripts/run-*mcp*.sh` | `scripts/_deprecated/` | Deprecate |

#### Maintenance Scripts

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/cleanup-dev-artifacts.sh` | Merge to cleanup.sh | Merge |
| `scripts/clear-all-dev-ports.sh` | `scripts/maintenance/port-cleanup.sh` | Move |
| `scripts/fix-workspace-deps.sh` | `scripts/maintenance/fix-workspace-deps.sh` | Move |
| `scripts/verify-*.sh` (various) | `scripts/maintenance/verify-install.sh` | Consolidate |
| `scripts/cleanup-*.sh` (5 others) | `scripts/_deprecated/` | Deprecate - one-time use |

#### Fix Scripts (ALL 76 FILES)

| Source | Destination | Action |
|--------|-------------|--------|
| `scripts/fix-*.sh` (76 files) | `scripts/_deprecated/2024-q4/fix-scripts/` | Archive ALL |
| Exception: `fix-workspace-deps.sh` | `scripts/maintenance/` | Keep this one |

**Reasoning:** Fix scripts are temporal. They solved specific issues at specific times. Archiving preserves history without cluttering active scripts. If issues recur, solutions should be integrated into main codebase or build process.

#### Root Directory Scripts (200+ files)

**Build Scripts (~30 files):**
- ALL → `scripts/_deprecated/2024-q4/root-builds/`

**Launch Scripts (~25 files):**
- ALL → `scripts/_deprecated/2024-q4/root-launches/`
- Exception: Consider soft-linking unified launcher to root for convenience

**Fix Scripts (~80 files):**
- ALL → `scripts/_deprecated/2024-q4/root-fixes/`

**Setup Scripts (~15 files):**
- ALL → `scripts/_deprecated/2024-q4/root-setup/`
- Exception: Keep `setup.sh` as soft-link to `scripts/core/setup-dev.sh`

**Docker Scripts (~15 files):**
- ALL → `scripts/_deprecated/2024-q4/root-docker/`

**Test Scripts (~10 files):**
- ALL → `scripts/testing/` (consolidate)

**Others (~25 files):**
- Categorize and move to appropriate `scripts/` subdirectory or deprecate

---

## Part 5: Risk Assessment

### High Risks

1. **Breaking CI/CD Pipeline**
   - Risk: Scripts referenced in CI/CD may break
   - Mitigation: Audit all CI/CD references first, update before moving
   - Impact: HIGH - Could block deployments

2. **Breaking Developer Workflows**
   - Risk: Developers have scripts bookmarked/memorized
   - Mitigation: Communication plan, migration guide, grace period with soft links
   - Impact: MEDIUM - Temporary productivity loss

3. **Loss of Critical Information**
   - Risk: Consolidating docs might lose nuanced details
   - Mitigation: Manual review of all merges, preserve everything in git history
   - Impact: MEDIUM - Can be recovered from git but time-consuming

### Medium Risks

4. **Broken Documentation Links**
   - Risk: Internal links break after moves
   - Mitigation: Search all docs for links before/after, automated link checker
   - Impact: MEDIUM - Frustrating but fixable

5. **Script Dependencies**
   - Risk: Scripts call other scripts; moving breaks dependencies
   - Mitigation: Audit script dependencies, update all relative paths
   - Impact: MEDIUM - Scripts fail until fixed

### Low Risks

6. **Confusion During Transition**
   - Risk: Some files in new location, some still in old
   - Mitigation: Complete phase-by-phase, clear communication
   - Impact: LOW - Temporary confusion

### Risk Mitigation Checklist

- [ ] Create backup branch before starting
- [ ] Audit all CI/CD configuration files
- [ ] Search codebase for hardcoded script paths
- [ ] Create soft links during transition period
- [ ] Run full test suite after each phase
- [ ] Document all changes in CHANGELOG.md
- [ ] Communicate clearly with team before/during/after
- [ ] Have rollback plan ready

---

## Part 6: Success Metrics

### Documentation Metrics

**Before:**
- ~200 documentation files
- 68 directories
- 23 root-level docs
- 8 _archive directories with 39 files
- Port management: 8 files
- MCP: 14 files
- Development guides: 3 files

**After (Target):**
- ~100 active documentation files (50% reduction)
- 15-20 organized directories
- 1 root-level README
- 1 _archive directory (consolidated)
- Port management: 2 files
- MCP: 3 files
- Development guides: 1 file

**Quality Metrics:**
- [ ] 100% of internal links working
- [ ] 0 duplicate content
- [ ] Every doc has "Last Updated" date
- [ ] Every doc has clear purpose
- [ ] New developer can find what they need in <5 minutes

### Scripts Metrics

**Before:**
- 431 scripts in scripts/
- 200+ scripts in root
- Total: ~630 scripts
- Fix scripts: 76
- Build scripts: ~40
- Launch scripts: ~35

**After (Target):**
- 45 active scripts in scripts/
- 0 scripts in root (maybe 1-2 convenience links)
- Total: ~45 active scripts (93% reduction)
- Fix scripts: 1 (fix-workspace-deps.sh)
- Build scripts: 4
- Launch scripts: 4

**Quality Metrics:**
- [ ] Every script has usage documentation
- [ ] Every script has error handling
- [ ] scripts/README.md lists all active scripts
- [ ] 0 duplicate functionality
- [ ] New developer can find right script in <2 minutes

### Process Metrics

- [ ] Consolidation completed in 8 weeks
- [ ] 0 production incidents during consolidation
- [ ] 100% team trained on new structure
- [ ] Migration guide created
- [ ] Video walkthrough created (optional)
- [ ] All feedback addressed

---

## Part 7: Post-Consolidation Maintenance

### Governance

**Documentation Rules:**
1. No new docs in root (except README.md)
2. All new docs must go in appropriate subdirectory
3. Update docs/ README when adding new sections
4. Archive old docs rather than deleting
5. Review and update docs quarterly

**Scripts Rules:**
1. No new scripts in project root (ever)
2. All new scripts must go in scripts/ subdirectory
3. Update scripts/README.md when adding scripts
4. Scripts must have usage comments
5. One-time fix scripts go directly to _deprecated/
6. Review and prune scripts quarterly

### Quarterly Review Process

**Every Quarter:**
1. Review most/least used documentation
2. Review most/least used scripts
3. Archive scripts not used in 6+ months
4. Update outdated documentation
5. Remove deprecated content >1 year old
6. Update README files

### Prevention Strategies

**Prevent Future Accumulation:**
1. PR template includes doc/script location check
2. CI checks for scripts in project root (fail if found)
3. Code review explicitly checks for duplication
4. Onboarding includes structure training
5. Monthly "cleanup" review in team meeting

**Documentation Best Practices:**
1. Before creating new doc, search for existing
2. Before duplicating content, link to existing
3. When updating, update all related docs
4. Tag docs with topics/categories
5. Use templates for common doc types

**Scripts Best Practices:**
1. Before creating new script, search for existing
2. Consider adding flag to existing script vs new script
3. Consolidate similar scripts periodically
4. Remove one-time scripts after use
5. Document scripts in code and README

---

## Appendix A: Commands for Implementation

### Documentation Consolidation Commands

```bash
# 1. Create new directory structure
cd ./docs
mkdir -p getting-started guides reference/architecture reference/api reference/protocols
mkdir -p troubleshooting project/_archive/2024-pre-restructure

# 2. Example: Consolidate Port Management docs
# (Do this manually after reviewing content)
cat PORT_MANAGEMENT.md PORT_MANAGEMENT_ARCHITECTURE.md PORT-MAPPING.md \
    development-and-troubleshooting/PORT_MANAGEMENT.md \
    development-and-troubleshooting/PORT_MANAGEMENT_QUICK_REFERENCE.md \
    development/PORT-CONFIGURATION.md \
    > reference/architecture/port-management-draft.md

# Edit manually to remove duplicates, reorganize, add TOC

# 3. Move deprecated docs
mv IMPLEMENTATION-PLAN.md _archive/2024-pre-restructure/
mv IMPLEMENTATION-SUMMARY.md _archive/2024-pre-restructure/
# ... etc

# 4. Create README files
touch README.md getting-started/README.md guides/README.md
touch reference/README.md troubleshooting/README.md _archive/README.md

# 5. Validate links (install if needed: npm install -g markdown-link-check)
find . -name "*.md" -exec markdown-link-check {} \;
```

### Scripts Consolidation Commands

```bash
# 1. Create new scripts directory structure
cd ./scripts
mkdir -p core build launch database mcp maintenance development testing
mkdir -p _deprecated/2024-q4/{fix-scripts,root-builds,root-launches,root-fixes}

# 2. Move active scripts
mv build.sh core/build.sh
mv production-build.sh build/production.sh
mv launch-unified.sh launch/unified.sh
# ... etc

# 3. Move deprecated scripts
mv fix-*.sh _deprecated/2024-q4/fix-scripts/
mv build-intelligent.sh _deprecated/2024-q4/
# ... etc

# 4. Handle root directory scripts
cd .
mv build-*.sh scripts/_deprecated/2024-q4/root-builds/
mv launch-*.sh scripts/_deprecated/2024-q4/root-launches/
mv fix-*.sh scripts/_deprecated/2024-q4/root-fixes/
# ... etc

# 5. Create convenience links (optional)
ln -s scripts/core/setup-dev.sh setup.sh
ln -s scripts/launch/unified.sh launch.sh

# 6. Create README files
touch scripts/README.md scripts/_deprecated/README.md

# 7. Make scripts executable
chmod +x scripts/core/*.sh scripts/build/*.sh scripts/launch/*.sh
# ... etc
```

### Validation Commands

```bash
# Check for broken links in docs
cd docs
find . -name "*.md" -exec grep -l "](/" {} \; | while read file; do
    echo "Checking $file"
    grep -o "](.*\.md)" "$file" | sed 's/](\(.*\))/\1/' | while read link; do
        if [ ! -f "$link" ]; then
            echo "  BROKEN: $link"
        fi
    done
done

# Find scripts that reference other scripts
cd scripts
grep -r "scripts/" . | grep "\.sh:" | cut -d: -f1 | sort -u

# Check for scripts called in package.json
cd .
grep -r "scripts/" package.json apps/*/package.json packages/*/package.json

# Test that key scripts still work
./scripts/core/build.sh --help
./scripts/launch/unified.sh --help
./scripts/database/reset.sh --help
```

---

## Appendix B: Communication Templates

### Initial Announcement

```
📢 **Major Documentation & Scripts Consolidation Coming**

Hey team! We're planning a major cleanup to make our project more maintainable:

**The Problem:**
- 630+ scripts scattered everywhere (most deprecated)
- 200+ docs with lots of duplication
- Hard to find what you need
- Slows down onboarding

**The Solution:**
- Consolidate to ~45 active scripts (93% reduction!)
- Organize docs into clear hierarchy
- Single source of truth for everything
- Clear deprecation of old content

**Timeline:** 8 weeks, starting [DATE]

**What You Need to Know:**
- Read the full plan: [LINK]
- Migration guide will be provided
- Your workflows may change slightly
- We'll provide training

**Questions?** Post in #dev-discussion or DM me.

---
Full Consolidation Plan: [LINK TO THIS DOC]
```

### Weekly Update Template

```
📊 **Consolidation Progress - Week X of 8**

**This Week:**
- ✅ Completed: [specific tasks]
- 🏗️ In Progress: [current work]
- 📋 Up Next: [next week's tasks]

**Metrics:**
- Scripts consolidated: X → Y
- Docs consolidated: X → Y
- Deprecated: X files moved to archive

**⚠️ Action Required:**
- [Any action needed from team]

**Next Week's Focus:**
- [What's happening next week]

Questions? See #consolidation-project
```

### Completion Announcement

```
🎉 **Documentation & Scripts Consolidation Complete!**

We've successfully completed our 8-week consolidation project!

**Results:**
✅ Scripts: 630 → 45 active (93% reduction!)
✅ Docs: 200 → 100 organized files
✅ Clear navigation and structure
✅ Migration guide created
✅ All team members trained

**What Changed:**
- New docs structure: docs/README.md
- New scripts structure: scripts/README.md
- Migration guide: [LINK]
- Video walkthrough: [LINK]

**What to Do Now:**
1. Update your bookmarks
2. Read the migration guide
3. Watch the walkthrough video (15 min)
4. Ask questions in #dev-discussion

**Old Content:**
- Archived in _deprecated/ directories
- Still accessible in git history
- Removal scheduled for [DATE] (1 year)

Thank you all for your patience during this transition!

---
Migration Guide: [LINK]
New Structure: [LINK]
```

---

## Appendix C: Detailed Consolidation Checklist

### Pre-Consolidation

**Documentation Audit:**
- [ ] List all PORT_MANAGEMENT*.md files and content
- [ ] List all MCP*.md files and content
- [ ] List all DEVELOPMENT*.md files and content
- [ ] List all GETTING_STARTED*.md files and content
- [ ] Create content comparison matrix
- [ ] Identify 100% duplicates
- [ ] Identify unique content in each file
- [ ] Plan merge strategy for each file group

**Scripts Audit:**
- [ ] Run git log on top 50 scripts
- [ ] Check CI/CD config for script references
- [ ] Check docs for script references
- [ ] Create script dependency graph
- [ ] Test top 20 scripts
- [ ] Categorize all scripts (keep/deprecate)
- [ ] Plan consolidation strategy

**Infrastructure:**
- [ ] Create backup branch
- [ ] Set up link checker tool
- [ ] Set up script validator
- [ ] Create consolidation workspace
- [ ] Notify team of start date

### Week 1-2: Port Management & MCP Docs

**Port Management:**
- [ ] Read all 8 port management files
- [ ] Extract unique content from each
- [ ] Create consolidated outline
- [ ] Write first draft
- [ ] Review for completeness
- [ ] Add all technical details
- [ ] Create troubleshooting section
- [ ] Add cross-references
- [ ] Validate all port numbers
- [ ] Test all examples
- [ ] Final review
- [ ] Commit new file
- [ ] Update links in other docs
- [ ] Move old files to archive

**MCP Documentation:**
- [ ] Read all 14 MCP files
- [ ] Extract unique content from each
- [ ] Create consolidated outline for each target
- [ ] Write guides/mcp-integration.md
- [ ] Write reference/protocols/mcp-specification.md
- [ ] Write troubleshooting/mcp.md
- [ ] Review for completeness
- [ ] Add cross-references
- [ ] Test all examples
- [ ] Final review
- [ ] Commit new files
- [ ] Update links in other docs
- [ ] Move old files to archive
- [ ] Add README to specifications/_archive/

### Week 3: Development Guides & Getting Started

**Development Guides:**
- [ ] Read all 3 development files
- [ ] Extract unique content
- [ ] Create consolidated outline
- [ ] Write consolidated guide
- [ ] Add setup instructions
- [ ] Add workflow instructions
- [ ] Test setup on clean machine
- [ ] Final review
- [ ] Commit new file
- [ ] Update links
- [ ] Move old files to archive

**Getting Started:**
- [ ] Read all getting started files
- [ ] Extract unique content
- [ ] Create outline for getting-started/ directory
- [ ] Write getting-started/README.md
- [ ] Write getting-started/prerequisites.md
- [ ] Update getting-started/installation.md
- [ ] Update getting-started/quick-start.md
- [ ] Add first-steps.md if needed
- [ ] Test complete setup flow
- [ ] Final review
- [ ] Commit new files
- [ ] Update links
- [ ] Move old files to archive

### Week 4: Troubleshooting & Project Docs

**Troubleshooting:**
- [ ] Read all troubleshooting files
- [ ] Categorize by topic
- [ ] Create troubleshooting/README.md
- [ ] Write troubleshooting/general.md
- [ ] Already have troubleshooting/mcp.md
- [ ] Already have troubleshooting/port-management.md
- [ ] Write troubleshooting/frontend.md
- [ ] Write troubleshooting/typescript.md
- [ ] Write troubleshooting/common-errors.md
- [ ] Add cross-references
- [ ] Test all solutions
- [ ] Final review
- [ ] Commit new files
- [ ] Update links
- [ ] Move old files to archive

**Project Documentation:**
- [ ] Audit project/, project-management/, project-planning/
- [ ] Identify overlaps
- [ ] Create consolidation plan
- [ ] Merge into project/ structure
- [ ] Update all content
- [ ] Final review
- [ ] Commit
- [ ] Move old files to archive

### Week 5: New README & Architecture

**Main README:**
- [ ] Design new README structure
- [ ] Write introduction
- [ ] Write navigation section
- [ ] Link to all main sections
- [ ] Add quickstart
- [ ] Add contribution guide link
- [ ] Review for clarity
- [ ] Get team feedback
- [ ] Final review
- [ ] Commit

**Architecture Docs:**
- [ ] Write reference/architecture/overview.md
- [ ] Already have reference/architecture/port-management.md
- [ ] Write reference/architecture/agent-system.md
- [ ] Write reference/architecture/vector-database.md
- [ ] Add diagrams if needed
- [ ] Cross-reference all docs
- [ ] Final review
- [ ] Commit

**Archive READMEs:**
- [ ] Write _archive/README.md
- [ ] Write _archive/2024-pre-restructure/README.md
- [ ] Explain what's archived and why
- [ ] Commit

### Week 6: Root Scripts Migration

**Preparation:**
- [ ] Create scripts/_deprecated/2024-q4/ structure
- [ ] Create all subdirectories
- [ ] Write scripts/_deprecated/README.md
- [ ] Write migration guide
- [ ] Commit

**Migration:**
- [ ] Move build-*.sh (30 files)
- [ ] Move launch-*.sh (25 files)
- [ ] Move fix-*.sh (80 files)
- [ ] Move setup-*.sh (15 files)
- [ ] Move docker-*.sh (15 files)
- [ ] Move test-*.sh (10 files)
- [ ] Categorize and move others (25 files)
- [ ] Create convenience links if needed
- [ ] Update any docs referencing these scripts
- [ ] Test that builds still work
- [ ] Test that launches still work
- [ ] Commit

### Week 7: Scripts Consolidation

**Core Scripts:**
- [ ] Move build.sh to scripts/core/
- [ ] Move setup-dev.sh to scripts/core/
- [ ] Move cleanup.sh to scripts/core/clean.sh
- [ ] Create scripts/core/dev.sh
- [ ] Test all core scripts
- [ ] Commit

**Build Scripts:**
- [ ] Move production-build.sh to scripts/build/
- [ ] Move build-incremental.sh to scripts/build/
- [ ] Move docker-build.sh to scripts/build/
- [ ] Create scripts/build/verify.sh
- [ ] Test all build scripts
- [ ] Move deprecated builds to _deprecated/
- [ ] Commit

**Launch Scripts:**
- [ ] Move launch-unified.sh to scripts/launch/
- [ ] Move launch-with-services.sh to scripts/launch/
- [ ] Move start-all.sh to scripts/launch/all.sh
- [ ] Create scripts/launch/frontend.sh
- [ ] Test all launch scripts
- [ ] Move deprecated launches to _deprecated/
- [ ] Commit

**Database Scripts:**
- [ ] Consolidate 4 reset scripts into scripts/database/reset.sh
- [ ] Test reset script with all use cases
- [ ] Update other database scripts
- [ ] Move old scripts to _deprecated/
- [ ] Commit

**MCP Scripts:**
- [ ] Move mcp-setup.sh to scripts/mcp/
- [ ] Move mcp-wizard.sh to scripts/mcp/
- [ ] Move mcp-config-manager.js to scripts/mcp/
- [ ] Move mcp-health-check.js to scripts/mcp/
- [ ] Test all MCP scripts
- [ ] Move deprecated MCP scripts to _deprecated/
- [ ] Commit

**Maintenance Scripts:**
- [ ] Create scripts/maintenance/cleanup.sh
- [ ] Create scripts/maintenance/port-cleanup.sh
- [ ] Move fix-workspace-deps.sh to scripts/maintenance/
- [ ] Create scripts/maintenance/verify-install.sh
- [ ] Test all maintenance scripts
- [ ] Move deprecated cleanup scripts to _deprecated/
- [ ] Commit

**Fix Scripts:**
- [ ] Move ALL fix-*.sh to _deprecated/2024-q4/fix-scripts/
- [ ] Exception: keep fix-workspace-deps.sh in maintenance/
- [ ] Create README in fix-scripts/ explaining each
- [ ] Commit

### Week 8: Testing & Finalization

**Documentation Validation:**
- [ ] Check all internal links
- [ ] Verify no broken references
- [ ] Test all code examples
- [ ] Verify all dates updated
- [ ] Check README navigation
- [ ] Run automated link checker
- [ ] Manual spot-check 20 random docs
- [ ] Get team review
- [ ] Fix any issues
- [ ] Final commit

**Scripts Validation:**
- [ ] Test all core scripts
- [ ] Test all build scripts
- [ ] Test all launch scripts
- [ ] Test all database scripts
- [ ] Test all MCP scripts
- [ ] Test all maintenance scripts
- [ ] Verify scripts have docs
- [ ] Verify scripts have error handling
- [ ] Check CI/CD still works
- [ ] Run full test suite
- [ ] Get team review
- [ ] Fix any issues
- [ ] Final commit

**README Files:**
- [ ] Write scripts/README.md
- [ ] Verify all active scripts listed
- [ ] Add usage examples
- [ ] Add migration guide link
- [ ] Review and finalize
- [ ] Commit

**Communication:**
- [ ] Create migration guide document
- [ ] Create video walkthrough (optional)
- [ ] Post completion announcement
- [ ] Schedule team Q&A
- [ ] Update onboarding docs
- [ ] Celebrate! 🎉

### Post-Consolidation

**Monitoring:**
- [ ] Monitor for issues first week
- [ ] Address feedback quickly
- [ ] Update docs based on questions
- [ ] Fix any broken workflows
- [ ] Document lessons learned

**Maintenance:**
- [ ] Schedule quarterly review
- [ ] Set up governance rules
- [ ] Add PR template checks
- [ ] Update contributing guide
- [ ] Train new team members

---

## Conclusion

This consolidation plan will transform The New Fuse from a cluttered codebase into a well-organized, maintainable project. The 93% reduction in active scripts and 50% reduction in documentation files will significantly improve:

- **Developer Productivity:** Find what you need in <5 minutes
- **Onboarding Time:** New developers can navigate the project quickly
- **Maintenance Burden:** Fewer files to update and maintain
- **Code Quality:** Clear structure encourages better practices
- **Team Collaboration:** Everyone knows where things belong

**Key Success Factors:**
1. Thorough planning (this document)
2. Manual review of all merges (preserve all details)
3. Clear communication with team
4. Phased approach (8 weeks)
5. Validation at each step
6. Post-consolidation governance

**Next Steps:**
1. Review this plan with team
2. Get stakeholder approval
3. Set start date
4. Create backup branch
5. Begin Phase 1 (Documentation Audit)

---

**Document Version:** 1.0
**Created:** 2025-10-23
**Author:** Consolidation Analysis
**Status:** Awaiting Approval

**Approvals Needed:**
- [ ] Technical Lead
- [ ] Product Owner
- [ ] Team Consensus

Once approved, update status and begin execution! 🚀
