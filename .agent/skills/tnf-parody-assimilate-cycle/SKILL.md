---
name: tnf-parody-assimilate-cycle
description: >-
  Run a PARODY + ASSIMILATE cycle to endow the TNF harness with an external
  agent's distinctive capabilities. Use when asked to "parody", "assimilate", or
  "endow tnf cli agent with what makes X powerful", or when an external CLI's
  feature should become TNF-native without duplicating an existing silo. Covers
  the capability inventory, gap matrix, extend-vs-new decision, codification,
  and regression verification.
primary_type: protocol
category: engineering/assimilation
risk_tier: low
harmful_pattern_detection: false
---

# TNF Parody + Assimilate Cycle

TNF's core tenet: parody the best from any agent, assimilate it into TNF-native
capabilities. This is the disciplined loop that does it without breaking
existing features (proven 2026-08-16 assimilating Command Code's todo/task tools
into the tnf CLI agent).

## The loop

### 1. ASSIMILATE — inventory the source agent's capabilities

Load the authoritative knowledge for the source agent (e.g. the bundled
`command-code-knowledge` skill + its `reference/*.md` files). Extract the
DISTINCTIVE capabilities — the ones that make it powerful, not the generic ones.
For Command Code those were: session checklist (`todo_write`), durable task
ledger (`task_*` with blockedBy), plan mode, headless print mode, event hooks,
sub-agents with isolated context + background runs, memory tiers, input repair,
progressive skill disclosure.

### 2. Inventory the TNF surface (no duplication)

Check the tnf CLI's existing surface for each capability. Sources:

- `packages/tnf-cli/src/command-surface.snapshot.json` — command paths
  (`python3` flatten to grep, or `tnf paths --json`)
- `packages/tnf-cli/src/commands/agents-run.ts` — the autonomous-loop toolset
- `packages/tnf-cli/src/utils/llm-tools.ts` — LLM-advertised tool schemas
- `packages/tnf-cli/src/services/` — existing services (KanbanService, ...)
- `scripts/` + `data/` for existing silos

Many .cmd capabilities are already covered with different names (tnf has
`--print`/`--mode plan`/worktree/hooks/skills/memory). Do NOT re-invent those.

### 3. Build the gap matrix

| .cmd feature | tnf surface | gap | extend-vs-new |

Mark each as `covered` (no action), `extend existing silo` (add to an existing
service/command), or `new` (only when NO silo exists). Per the parody lesson:
"port X into tnf" requires an inventory, an explicit extend-vs-new decision per
gap, and one-line justification per new directory.

### 4. Codify the gaps TNF-native

Prefer extending an existing silo. Example (todo tools):

- Tool schemas: add `todo_add`/`todo_list`/`todo_update`/`todo_done` to
  `utils/llm-tools.ts` (name, category, defaultEnabled, description, parameters
  with required + additionalProperties:false).
- Executor: add matching `case 'todo_*'` blocks to `executeBuiltinTool` in
  `commands/agents-run.ts`, backed by the existing `KanbanService`
  (`~/.tnf/kanban/*.json`).
- Update the `Tools: ...` help text in the command description.
- This is runtime tools — it does NOT touch the command surface snapshot.

### 5. Verify — never break existing features

```bash
pnpm --filter @the-new-fuse/tnf-cli run build
(cd packages/tnf-cli && npx tsc -p tsconfig.json --noEmit)   # 0 errors
node scripts/protocols/command-surface-gate.cjs --mode=ci    # OK (no CLI command added)
node scripts/protocols/validate-turn-zero-authority.cjs      # OK
node scripts/harness/verify-harness-completeness.cjs         # PASS
```

Smoke the new capability directly (bypass the slow LLM loop) by importing
`executeBuiltinTool` from the package dir with a temp .mts file, exercising each
new tool against the real backing store, and deleting the file.

## Guardrails

- **Never invent a parallel registry.** If an existing service/command covers
  the role, EXTEND it. New directories need justification.
- **Runtime tools ≠ CLI commands.** Tool additions to llm-tools.ts/agents-run.ts
  do not change the command surface; only `.command()`/`.option()` changes do.
- **Concurrent-agent drift:** another agent may commit your file mid-session
  (observed 2026-08-16). Re-verify the FULL capability works after any
  concurrent commit, not just the files you edited.
- **Honest reporting:** if a gap is only partially closed, say so. Never claim
  assimilated when the wiring is half-landed.
