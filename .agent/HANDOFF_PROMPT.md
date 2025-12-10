# 🔍 FULL CODEBASE AUDIT - BACKEND & ORPHAN DISCOVERY

## The New Fuse - Systematic File-by-File Assessment

---

## ⚠️ CRITICAL: READ THIS FIRST

**DO NOT** work on frontend pages that have already been refactored. Those are
DONE.

**YOUR MISSION**: Crawl through **EVERY DIRECTORY** in the codebase, assess
**EVERY FILE**, and determine:

1. Is this file used/imported anywhere?
2. Is this file functional or broken?
3. Is this file properly integrated into the application?
4. Does the backend code connect correctly to the frontend?

---

## 🎯 PRIMARY TARGETS (In Order)

### 1. Backend API (`apps/api/src/`)

**~26 controllers, ~41 services, numerous modules**

Crawl EVERY file and verify:

- [ ] Controller is registered in its module
- [ ] Routes are properly decorated (@Get, @Post, etc.)
- [ ] Service is injectable and used
- [ ] DTOs exist and match request/response shapes
- [ ] Database interactions use Prisma correctly
- [ ] Frontend actually calls these endpoints

```bash
# List all backend files
find apps/api/src -type f -name "*.ts" | head -50
```

### 2. Backend Services (`apps/backend/src/`)

Separate from API - additional backend services

```bash
find apps/backend/src -type f -name "*.ts" | head -50
```

### 3. Shared Packages (`packages/*/`)

**~30+ packages** - many may be orphaned or broken

Priority packages to audit:

- `packages/database/` - Prisma schema, migrations, generated types
- `packages/core/` - Core utilities
- `packages/types/` - Shared TypeScript types
- `packages/agent/` - Agent system logic
- `packages/mcp-core/` - MCP protocol
- `packages/workflow-engine/` - Workflow execution
- `packages/security/` - Security utilities

```bash
# List all packages
ls -la packages/
```

### 4. Frontend Components (`apps/frontend/src/components/`)

**~441 component files** - Find orphans!

```bash
# Find components not imported anywhere
for file in $(find apps/frontend/src/components -name "*.tsx"); do
  basename=$(basename "$file" .tsx)
  if ! grep -r "$basename" apps/frontend/src --include="*.tsx" --include="*.ts" | grep -v "^$file:" > /dev/null 2>&1; then
    echo "ORPHAN: $file"
  fi
done
```

### 5. Frontend Services (`apps/frontend/src/services/`)

Verify each service:

- [ ] Is exported and used
- [ ] API endpoints it calls exist in backend
- [ ] Error handling is implemented

### 6. Frontend Hooks (`apps/frontend/src/hooks/`)

Verify each hook:

- [ ] Is exported and used
- [ ] Dependencies are properly declared
- [ ] No broken imports

---

## 📋 FILE ASSESSMENT TEMPLATE

For each file you examine, determine:

```markdown
## File: [path/to/file.ts]

### Purpose

[What does this file do?]

### Status

- [ ] Used/Imported: YES / NO / UNCLEAR
- [ ] Functional: YES / NO / PARTIAL
- [ ] Integrated: YES / NO / PARTIAL
- [ ] Frontend Connected (if backend): YES / NO / N/A

### Issues Found

1. [Issue description]
2. [Issue description]

### Action Required

- [ ] KEEP - File is good
- [ ] FIX - File needs repair
- [ ] DELETE - File is orphan/dead code
- [ ] INTEGRATE - File exists but not connected
```

---

## 🔧 AUDIT COMMANDS

### Find all TypeScript files in backend

```bash
find apps/api/src -name "*.ts" | wc -l
find apps/backend/src -name "*.ts" | wc -l
```

### Find all controllers and check if registered

```bash
# List all controllers
find apps/api/src -name "*.controller.ts"

# For each controller, check if it's in a module
grep -r "Controller" apps/api/src/**/*.module.ts
```

### Find all services and check if injectable

```bash
find apps/api/src -name "*.service.ts"
```

### Check frontend service → backend endpoint connections

```bash
# Find all fetch/axios calls in frontend
grep -r "fetch\|axios" apps/frontend/src/services/ --include="*.ts"

# Compare to backend routes
grep -r "@Get\|@Post\|@Put\|@Delete" apps/api/src/
```

### Find orphaned frontend components

```bash
# Components that are never imported
grep -rL "import" apps/frontend/src/components/*.tsx
```

---

## 🚫 WHAT NOT TO AUDIT (Already Done)

These frontend pages were already refactored to Premium Design System - **SKIP
THEM**:

```
apps/frontend/src/pages/dashboard/index.tsx ✅
apps/frontend/src/pages/dashboard/Analytics.tsx ✅
apps/frontend/src/pages/dashboard/CreateAgent.tsx ✅
apps/frontend/src/pages/Agents/AgentsPage.tsx ✅
apps/frontend/src/pages/Agents/index.tsx ✅
apps/frontend/src/pages/Agents/Detail.tsx ✅
apps/frontend/src/pages/Agents/New.tsx ✅
apps/frontend/src/pages/Agents.tsx ✅
apps/frontend/src/pages/AgentNew.tsx ✅
apps/frontend/src/pages/AIAgentPortal.tsx ✅
apps/frontend/src/pages/Settings.tsx ✅
apps/frontend/src/pages/GeneralSettings.tsx ✅
apps/frontend/src/pages/Workflows.tsx ✅
apps/frontend/src/pages/WorkflowsEnhanced.tsx ✅
apps/frontend/src/pages/WorkflowTemplates.tsx ✅
apps/frontend/src/pages/Tasks/index.tsx ✅
apps/frontend/src/pages/WorkspaceChat.tsx ✅
apps/frontend/src/pages/MetricsDashboard.tsx ✅
apps/frontend/src/pages/Resources/*.tsx ✅
```

---

## 📊 DIRECTORY INVENTORY

Run this first to understand the scope:

```bash
echo "=== BACKEND API ===" && find apps/api/src -type f -name "*.ts" | wc -l
echo "=== BACKEND SERVICES ===" && find apps/backend/src -type f -name "*.ts" 2>/dev/null | wc -l
echo "=== PACKAGES ===" && ls -d packages/*/ | wc -l
echo "=== FRONTEND COMPONENTS ===" && find apps/frontend/src/components -type f -name "*.tsx" | wc -l
echo "=== FRONTEND SERVICES ===" && find apps/frontend/src/services -type f -name "*.ts" 2>/dev/null | wc -l
echo "=== FRONTEND HOOKS ===" && find apps/frontend/src/hooks -type f -name "*.ts" 2>/dev/null | wc -l
```

---

## 🎯 START HERE

1. **Run the inventory command above** to see file counts
2. **Start with `apps/api/src/controllers/`** - List all controllers, verify
   each one
3. **Move to `apps/api/src/services/`** - List all services, verify each one
4. **Check `apps/api/src/modules/`** - Verify controller/service registration
5. **Audit `packages/` one by one** - Find broken/orphaned packages
6. **Scan `apps/frontend/src/components/`** - Find orphaned components
7. **Verify `apps/frontend/src/services/`** - Check API endpoint connections

---

## ✅ SUCCESS CRITERIA

The audit is complete when:

- [ ] Every backend controller has been verified as registered and functional
- [ ] Every backend service has been verified as used
- [ ] API endpoints match frontend service calls
- [ ] Orphaned frontend components have been removed or integrated
- [ ] All packages in `packages/` are verified as used or marked for removal
- [ ] Build passes: `pnpm run build` exit code 0

---

## 📝 PROGRESS TRACKING

After each directory audit, log your findings:

```markdown
## Audit Progress: [Date]

### Completed

- [x] apps/api/src/controllers/ (X files, Y issues)
- [ ] apps/api/src/services/
- [ ] packages/database/ ...

### Issues Found

1. [Issue] - [Fix status]
2. [Issue] - [Fix status]

### Files Removed

- path/to/orphan.ts (reason)

### Build Status: ✅ / ❌
```

---

**PROJECT ROOT**: `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

_Last Updated: December 9, 2024_ _Focus: Backend & Package Audit, Orphan
Discovery_
