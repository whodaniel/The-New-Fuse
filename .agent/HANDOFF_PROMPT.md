# 🚀 AI AGENT HANDOFF PROMPT

## The New Fuse - Codebase Hardening & Integration Audit

---

## COPY THIS ENTIRE PROMPT TO START EVERY NEW AGENT SESSION

---

### 📋 MISSION BRIEFING

You are continuing a systematic audit of **The New Fuse** codebase. The previous
agent completed a Premium Design System refactor of 16+ major pages. Your
mission is to:

1. **Audit every remaining file** for purpose, functionality, and integration
2. **Enforce Premium Design System** on all internal application pages
3. **Verify frontend-backend integration** for all API calls
4. **Remove dead code and orphan files**
5. **Ensure TypeScript strictness** (no `any` types, proper event typing)

---

### 📊 CODEBASE SCALE (Current State)

| Directory                       | File Count      | Notes                          |
| ------------------------------- | --------------- | ------------------------------ |
| `apps/frontend/src/pages/`      | ~178 TSX files  | Many need Premium Design audit |
| `apps/frontend/src/components/` | ~441 TSX files  | Potential orphans exist        |
| `apps/api/src/controllers/`     | ~26 controllers | Need route verification        |
| `apps/api/src/services/`        | ~41 services    | Need integration check         |

---

### ✅ ALREADY COMPLETED (Don't Re-Refactor)

These pages are **Premium Design System compliant**:

- `dashboard/index.tsx`, `Analytics.tsx`, `CreateAgent.tsx`
- `Agents/AgentsPage.tsx`, `index.tsx`, `Detail.tsx`, `New.tsx`
- `Agents.tsx`, `AgentNew.tsx`, `AIAgentPortal.tsx`
- `Settings.tsx`, `GeneralSettings.tsx`
- `Workflows.tsx`, `WorkflowsEnhanced.tsx`, `WorkflowTemplates.tsx`
- `Tasks/index.tsx`, `WorkspaceChat.tsx`, `MetricsDashboard.tsx`
- `Resources/` (all files)

---

### 🎨 PREMIUM DESIGN SYSTEM REQUIREMENTS

**Components to use** (from `@/components/ui/premium`):

```tsx
import {
  GlassCard,
  StatsCard,
  ActionCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
  ToggleSwitch,
} from '@/components/ui/premium';
```

**Background** (REQUIRED for internal pages):

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
```

**Icons**: `lucide-react` ONLY - no emojis, no other icon libraries

**Animations**: `framer-motion` for all transitions

**Badges**: Semi-transparent styling:

```tsx
<Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
```

---

### 🔧 CODING STANDARDS (STRICT)

1. **No `any` types** - Explicitly type all parameters
2. **Use `@/` imports** - No relative paths like `../../`
3. **Type events explicitly**: `(e: React.ChangeEvent<HTMLInputElement>)`
4. **Type map parameters**: `.map((item: ItemType) => ...)`
5. **No `eval()`** - Use `new Function()` with scope isolation if needed

---

### 📝 YOUR WORKFLOW

1. **Read the full handoff workflow first**:

   ```
   /codebase-audit-handoff
   ```

   This file is at: `.agent/workflows/codebase-audit-handoff.md`

2. **Pick a directory to audit** (suggested order):
   - `apps/frontend/src/pages/Admin/`
   - `apps/frontend/src/pages/settings/`
   - `apps/frontend/src/pages/workspace/`
   - `apps/frontend/src/pages/workflow-pages/`

3. **For each file**, check:
   - Is it imported/used anywhere?
   - Does it use Premium Design System?
   - Are there TypeScript errors?
   - Does it have proper imports?

4. **Run build after changes**:

   ```bash
   cd apps/frontend && pnpm run build
   ```

5. **Report your progress** in this format:
   ```
   ## Audit Report: [Directory Name]
   - Files Reviewed: X
   - Issues Fixed: Y
   - Files Deleted: Z
   - Build Status: ✅ GREEN
   ```

---

### 🚨 CRITICAL RULES

- **NEVER delete without verification** - Confirm file is truly orphaned
- **ALWAYS run build** - Exit code 0 required after changes
- **PRESERVE functionality** - Only upgrade visuals, don't break features
- **Marketing pages stay light** - `Landing.tsx`, `Pricing.tsx`, `Docs.tsx`,
  etc.

---

### 🔍 USEFUL COMMANDS

```bash
# Find pages NOT using Premium components
grep -rL "from.*ui/premium" apps/frontend/src/pages/*.tsx

# Find files with any types
grep -r ": any" apps/frontend/src/pages/

# Find emoji usage (should be removed)
grep -r "⚡\|🔄\|🤖\|🔍\|📊\|✅\|❌" apps/frontend/src/pages/

# Find relative imports (should use @/)
grep -r "from '\.\." apps/frontend/src/pages/

# Verify build
cd apps/frontend && pnpm run build
```

---

### 🎯 SUCCESS CRITERIA

You're done when:

- [ ] All internal pages use Premium Design System
- [ ] No TypeScript `any` types in page components
- [ ] All imports use `@/` alias
- [ ] No orphaned/unused files remain
- [ ] All routes are verified functional
- [ ] Build passes with exit code 0

---

**START BY RUNNING**: `/codebase-audit-handoff` to read the full workflow
document.

**PROJECT ROOT**: `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

---

_Created: December 9, 2024 | Previous Session: Premium Design System Refactor
Complete_
